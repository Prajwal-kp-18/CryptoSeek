import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, GitBranch, Code } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Edge {
  src: string;
  dst: string;
  edge_type: string;
  is_loop_edge: boolean;
  branch_condition_complexity: number;
}

interface Node {
  address: string;
  instruction_count: number;
  crypto_constant_hits: number;
  bitwise_op_density: number;
  immediate_entropy: number;
  table_lookup_presence: boolean;
}

interface CFGVisualizationProps {
  edges: Edge[];
  nodes: Node[];
  graphMetrics: {
    num_basic_blocks: number;
    num_edges: number;
    num_conditional_edges: number;
    num_unconditional_edges: number;
    loop_count: number;
    cyclomatic_complexity: number;
  };
}

export const CFGVisualization = ({ edges, nodes, graphMetrics }: CFGVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !edges || !nodes) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a simple layout for nodes
    const nodePositions = new Map<string, { x: number; y: number }>();
    const uniqueAddresses = Array.from(new Set([
      ...edges.map(e => e.src),
      ...edges.map(e => e.dst)
    ]));

    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(uniqueAddresses.length));
    const nodeRadius = 30;
    const paddingX = 100;
    const paddingY = 80;
    const spacingX = (canvas.width - 2 * paddingX) / Math.max(cols - 1, 1);
    const spacingY = (canvas.height - 2 * paddingY) / Math.max(Math.ceil(uniqueAddresses.length / cols) - 1, 1);

    uniqueAddresses.forEach((addr, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      nodePositions.set(addr, {
        x: paddingX + col * spacingX,
        y: paddingY + row * spacingY
      });
    });

    // Draw edges first
    edges.forEach(edge => {
      const src = nodePositions.get(edge.src);
      const dst = nodePositions.get(edge.dst);
      
      if (src && dst) {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        
        // Style based on edge type
        if (edge.is_loop_edge) {
          ctx.strokeStyle = '#f59e0b'; // Orange for loop edges
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
        } else if (edge.edge_type === 'conditional') {
          ctx.strokeStyle = '#3b82f6'; // Blue for conditional
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = '#64748b'; // Gray for unconditional
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
        
        // Draw arrow head
        const angle = Math.atan2(dst.y - src.y, dst.x - src.x);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(dst.x - nodeRadius * Math.cos(angle), dst.y - nodeRadius * Math.sin(angle));
        ctx.lineTo(
          dst.x - nodeRadius * Math.cos(angle) - arrowSize * Math.cos(angle - Math.PI / 6),
          dst.y - nodeRadius * Math.sin(angle) - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          dst.x - nodeRadius * Math.cos(angle) - arrowSize * Math.cos(angle + Math.PI / 6),
          dst.y - nodeRadius * Math.sin(angle) - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    });

    // Draw nodes
    nodePositions.forEach((pos, addr) => {
      const node = nodes.find(n => n.address === addr);
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      
      // Color based on crypto indicators
      if (node && node.crypto_constant_hits > 0) {
        ctx.fillStyle = '#ef4444'; // Red for crypto
      } else if (node && node.table_lookup_presence) {
        ctx.fillStyle = '#f59e0b'; // Orange for table lookups
      } else {
        ctx.fillStyle = '#10b981'; // Green for regular
      }
      
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw address label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(addr.slice(-4), pos.x, pos.y);
    });

    ctx.setLineDash([]); // Reset dash pattern
  }, [edges, nodes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Control Flow Graph
        </CardTitle>
        <CardDescription>
          Visual representation of function control flow and basic blocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Graph Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{graphMetrics.num_basic_blocks}</div>
            <div className="text-xs text-muted-foreground">Basic Blocks</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{graphMetrics.num_edges}</div>
            <div className="text-xs text-muted-foreground">Edges</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{graphMetrics.num_conditional_edges}</div>
            <div className="text-xs text-muted-foreground">Conditional</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{graphMetrics.num_unconditional_edges}</div>
            <div className="text-xs text-muted-foreground">Unconditional</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{graphMetrics.loop_count}</div>
            <div className="text-xs text-muted-foreground">Loops</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{graphMetrics.cyclomatic_complexity}</div>
            <div className="text-xs text-muted-foreground">Complexity</div>
          </div>
        </div>

        {/* Legend
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm">Crypto Constants</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-sm">Table Lookups</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Regular Block</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-sm">Conditional Edge</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-orange-500" style={{ borderBottom: '2px dashed' }}></div>
            <span className="text-sm">Loop Edge</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-500"></div>
            <span className="text-sm">Unconditional</span>
          </div>
        </div> */}

        {/* Canvas */}
        {/* <div className="border rounded-lg bg-white">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '600px' }}
          />
        </div> */}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold mb-2">Block Details: {selectedNode.address}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Instructions:</span>
                <span className="ml-2 font-medium">{selectedNode.instruction_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Crypto Hits:</span>
                <span className="ml-2 font-medium">{selectedNode.crypto_constant_hits}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Bitwise Density:</span>
                <span className="ml-2 font-medium">{selectedNode.bitwise_op_density.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Entropy:</span>
                <span className="ml-2 font-medium">{selectedNode.immediate_entropy.toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
