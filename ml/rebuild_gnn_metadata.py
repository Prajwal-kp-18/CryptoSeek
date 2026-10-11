#!/usr/bin/env python3
"""
Rebuild ml/gnn_models/metadata.pkl for the existing ml/gnn_models/best_model.pth.

The original metadata.pkl (feature scalers + label encoder fitted during training) was
lost together with the training data. This script reconstructs it:
  - label encoder: the 16 classes the checkpoint was trained on (LabelEncoder sorts
    classes, so this order matches the classifier output layer)
  - model config: read from the checkpoint's weight shapes
  - node/edge/graph scalers: refitted on a reference set of Ghidra feature JSONs
    (output of ghidra_scripts/extract_features.py)

Because the scalers are refitted on different data than the original training set,
predictions are approximate. Retrain with new_gnn.py once labelled data is available.

Usage:
  python ml/rebuild_gnn_metadata.py --reference-dir <dir with *_features.json>
"""
import argparse
import glob
import json
import os
import pickle
import sys

import torch
from sklearn.preprocessing import LabelEncoder

ML_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ML_DIR)
from new_gnn import GraphDataset  # noqa: E402

GNN_CLASSES = [
    'AEAD', 'AES', 'Blake2b', 'ChaCha20', 'Curve25519', 'DH', 'ECC', 'EdDSA',
    'Elligator', 'HMAC', 'KDF', 'Non-Crypto', 'Poly1305', 'RSA', 'SHA', 'Utility',
]


def model_config_from_checkpoint(model_path):
    state = torch.load(model_path, map_location='cpu', weights_only=False)['model_state_dict']
    num_layers = len({k.split('.')[1] for k in state if k.startswith('convs.')})
    heads = state['convs.0.att_src'].shape[1]
    num_classes = state[max((k for k in state if k.startswith('classifier.') and k.endswith('.weight')),
                            key=lambda k: int(k.split('.')[1]))].shape[0]
    hidden_dim = state['node_encoder.0.weight'].shape[0]
    if num_classes != len(GNN_CLASSES):
        raise ValueError(f"Checkpoint has {num_classes} classes, expected {len(GNN_CLASSES)}")
    if heads != 8:
        raise ValueError(f"Checkpoint uses {heads} attention heads, new_gnn.py builds 8")
    return {
        'num_node_features': state['node_encoder.0.weight'].shape[1],
        'num_edge_features': state['edge_encoder.0.weight'].shape[1],
        'num_graph_features': state['graph_encoder.0.weight'].shape[1],
        'num_classes': num_classes,
        'hidden_dim': hidden_dim,
        'num_layers': num_layers,
        'dropout': 0.3,
        'conv_type': 'gat',
        'pooling': 'concat',
    }


def main():
    parser = argparse.ArgumentParser(description='Rebuild GNN metadata.pkl for best_model.pth')
    parser.add_argument('--reference-dir', required=True, help='Directory of Ghidra *_features.json files')
    parser.add_argument('--model', default=os.path.join(ML_DIR, 'gnn_models', 'best_model.pth'))
    parser.add_argument('--output', default=os.path.join(ML_DIR, 'gnn_models', 'metadata.pkl'))
    args = parser.parse_args()

    model_config = model_config_from_checkpoint(args.model)

    json_files = sorted(glob.glob(os.path.join(args.reference_dir, '*.json')))
    if not json_files:
        raise SystemExit(f"No JSON files found in {args.reference_dir}")

    label_encoder = LabelEncoder().fit(GNN_CLASSES)
    dataset = GraphDataset([], label_encoder)
    for json_file in json_files:
        with open(json_file) as f:
            data = json.load(f)
        for func in data.get('functions', []):
            graph = dataset._function_to_graph(func, data.get('binary', {}))
            if graph is not None:
                dataset.graphs.append(graph)
    if not dataset.graphs:
        raise SystemExit("No usable functions found in reference JSONs")

    first = dataset.graphs[0]
    dims = (first['node_features'].shape[1], first['edge_features'].shape[1], first['graph_features'].shape[0])
    expected = (model_config['num_node_features'], model_config['num_edge_features'], model_config['num_graph_features'])
    if dims != expected:
        raise SystemExit(f"Feature dims {dims} do not match checkpoint {expected}")

    dataset._fit_scalers()

    with open(args.output, 'wb') as f:
        pickle.dump({
            'label_encoder': label_encoder,
            'node_scaler': dataset.node_scaler,
            'edge_scaler': dataset.edge_scaler,
            'graph_scaler': dataset.graph_scaler,
            'model_config': model_config,
            'scalers_fitted_on': [os.path.basename(p) for p in json_files],
        }, f)

    print(f"Fitted scalers on {len(dataset.graphs)} functions from {len(json_files)} files")
    print(f"Model config: {model_config}")
    print(f"Saved metadata to {args.output}")


if __name__ == '__main__':
    main()
