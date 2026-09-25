# Feature Extraction Visualization Update

## Overview
Enhanced the JobAnalysis page with comprehensive visualization and detailed display of feature extraction data, including control flow graphs, detailed function analysis, and opcode statistics.

## New Components Created

### 1. CFGVisualization.tsx
**Location:** `/frontend/src/components/CFGVisualization.tsx`

**Features:**
- Visual representation of Control Flow Graph using HTML5 Canvas
- Displays basic blocks as nodes with different colors based on crypto indicators
- Shows edges with different styles (conditional, unconditional, loop edges)
- Interactive graph metrics display showing:
  - Number of basic blocks
  - Total edges (conditional vs unconditional)
  - Loop count
  - Cyclomatic complexity
- Color-coded legend for easy interpretation
- Node coloring based on:
  - Red: Contains crypto constants
  - Orange: Has table lookups
  - Green: Regular blocks

### 2. FunctionAnalysisDetails.tsx
**Location:** `/frontend/src/components/FunctionAnalysisDetails.tsx`

**Features:**
Comprehensive tabbed interface showing detailed function-level analysis:

#### Tab: Overview
- Entropy Metrics (function entropy, opcode entropy, complexity density)
- Data References (stack frame size, RO data refs, string refs)
- Instruction Patterns (unique n-grams, top bigrams)

#### Tab: Graph Metrics
- Basic blocks, edges, cyclomatic complexity
- Loop count and depth
- Branch density and average block size
- Strongly connected components

#### Tab: Crypto Signatures
- AES S-Box detection
- AES RCON detection
- SHA Constants detection
- RSA BigInt detection
- Visual indicators with checkmarks and color-coded cards

#### Tab: Opcodes
- Operation ratios (XOR, Add, Rotate, Logical, Load/Store)
- Operation counts (Arithmetic, Bitwise, Crypto-like)
- Visual progress bars for each metric

#### Tab: Advanced Features
Four subsections with detailed crypto-specific analysis:
1. **AES Detection**: S-Box, RCON, key expansion, T-Box, MixColumns patterns
2. **SHA Detection**: Init constants, K-table hits, rotation patterns
3. **RSA/BigInt Detection**: BigInt operations, width, Montgomery ops, ModExp density
4. **ECC/Stream Cipher**: Curve25519, ladder steps, CSWAP, QuarterRound, bitwise mix
5. **Table Analysis**: Large tables count, entropy scores, S-Box matching

#### Tab: Basic Blocks
- Detailed view of each basic block with:
  - Address and instruction count
  - Crypto constant hits
  - Entropy and bitwise density
  - Opcode distribution histogram
  - Detected constant flags
- Color-coded blocks based on crypto indicators

### 3. OpcodeAnalysis.tsx
**Location:** `/frontend/src/components/OpcodeAnalysis.tsx`

**Features:**
- **Opcode Distribution Chart**: Bar chart showing top 15 most used opcodes
- **Operation Ratios Pie Chart**: Visual percentage distribution of operation types
- **Instruction Patterns**: Display of unique n-grams and top bigrams
- **Detailed Metrics Table**: Comprehensive breakdown with visual progress bars

Uses Recharts library for interactive visualizations.

## Updated Components

### JobAnalysis.tsx
**Changes to FeatureExtractionCard:**
- Removed simple function list view
- Integrated new comprehensive components
- For each function, displays:
  1. FunctionAnalysisDetails (all tabs)
  2. CFGVisualization (control flow graph)
  3. OpcodeAnalysis (opcode statistics)
- Maintains binary sections overview tab
- Better error handling for missing data

## Data Displayed

### From feature_extraction_results:
```json
{
  "summary": {
    "total_functions": number,
    "crypto_functions": number,
    "average_entropy": number,
    "binary_sections": {...}
  },
  "functions": [{
    "address": string,
    "name": string,
    "label": string,
    "arch": string,
    "graph_level": {...},
    "edge_level": [...],
    "node_level": [...],
    "crypto_signatures": {...},
    "op_category_counts": {...},
    "entropy_metrics": {...},
    "advanced_features": {...},
    "instruction_sequence": {...}
  }]
}
```

## Visual Improvements

1. **Better Organization**: Information organized into logical tabs and sections
2. **Color Coding**: Consistent color scheme for crypto indicators (red), warnings (orange), and normal operations (green/blue)
3. **Interactive Charts**: Bar charts, pie charts, and progress bars for better data comprehension
4. **Visual Hierarchy**: Clear heading structure and card-based layout
5. **Responsive Design**: Grid layouts that adapt to screen size

## Key Features

### Control Flow Graph
- Canvas-based rendering for smooth performance
- Visual distinction between edge types
- Node coloring based on crypto characteristics
- Compact metric display at the top

### Comprehensive Metrics
- **27+ different advanced features** tracked and displayed
- **Entropy analysis** at multiple levels
- **Crypto signature detection** for AES, SHA, RSA, ECC, and stream ciphers
- **Opcode analysis** with ratios and histograms
- **Graph structure analysis** with complexity metrics

### User Experience
- Tabbed interface for easy navigation
- Badges for quick status identification
- Progress bars for ratio/percentage values
- Monospace fonts for addresses and code
- Tooltips and descriptions for context

## Technical Stack

- **React**: Component architecture
- **TypeScript**: Type safety
- **Recharts**: Chart library for visualizations
- **HTML5 Canvas**: CFG rendering
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components (Card, Badge, Tabs, Progress, etc.)

## Usage

When viewing a job analysis:
1. Navigate to the "Features" tab
2. See the overview with binary sections
3. Scroll down to see detailed function analysis
4. Each function displays:
   - Detailed metrics in tabs (Overview, Graph, Crypto, Opcodes, Advanced, Blocks)
   - Visual CFG representation
   - Opcode distribution charts

## Benefits

1. **Comprehensive Analysis**: All feature extraction data is now visible
2. **Better Understanding**: Visual representations make patterns easier to identify
3. **Quick Identification**: Color coding and badges highlight crypto functions
4. **Detailed Insights**: Advanced features tab shows algorithm-specific detections
5. **Research-Ready**: Detailed metrics support security research and reverse engineering

## Next Steps (Optional Enhancements)

1. Add zoom/pan controls to CFG visualization
2. Make nodes clickable to show block details
3. Add filtering options for function list
4. Export individual charts/graphs
5. Add comparison view between functions
6. Integrate disassembly view for selected blocks
7. Add highlighting of suspicious patterns
