import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Code, 
  Shield, 
  Activity, 
  BarChart3, 
  Database,
  Braces,
  Hash,
  Zap,
  Binary
} from "lucide-react";

interface FunctionData {
  address: string;
  name: string;
  label: string;
  arch: string;
  graph_level: {
    num_basic_blocks: number;
    num_edges: number;
    cyclomatic_complexity: number;
    loop_count: number;
    loop_depth: number;
    branch_density: number;
    average_block_size: number;
    strongly_connected_components: number;
  };
  crypto_signatures: {
    has_aes_sbox: number;
    has_aes_rcon: number;
    has_sha_constants: number;
    rsa_bigint_detected: number;
  };
  op_category_counts: {
    arithmetic_ops: number;
    bitwise_ops: number;
    crypto_like_ops: number;
    xor_ratio: number;
    add_ratio: number;
    rotate_ratio: number;
    multiply_ratio: number;
    logical_ratio: number;
    load_store_ratio: number;
  };
  data_references: {
    stack_frame_size: number;
    rodata_refs_count: number;
    string_refs_count: number;
  };
  entropy_metrics: {
    function_byte_entropy: number;
    opcode_entropy: number;
    cyclomatic_complexity_density: number;
  };
  advanced_features: {
    has_aes_sbox: boolean;
    has_aes_rcon: boolean;
    num_large_tables: number;
    table_entropy_score: number;
    aes_sbox_match_score: number;
    mixcolumns_pattern_score: number;
    key_expansion_detection: boolean;
    tbox_detected: boolean;
    sha_init_constants_hits: number;
    sha_k_table_hits: number;
    sha_rotation_patterns: number;
    bigint_op_count: number;
    bigint_width: number;
    montgomery_op_count: number;
    modexp_op_density: number;
    curve25519_constant_detection: boolean;
    ladder_step_count: number;
    cswap_patterns: number;
    quarterround_score: number;
    bitwise_mix_operations: number;
  };
  instruction_sequence: {
    unique_ngram_count: number;
    top_5_bigrams: string[];
  };
  node_level: Array<{
    address: string;
    instruction_count: number;
    crypto_constant_hits: number;
    immediate_entropy: number;
    bitwise_op_density: number;
    table_lookup_presence: boolean;
    opcode_histogram: Record<string, number>;
    constant_flags: Record<string, boolean>;
  }>;
}

interface FunctionAnalysisDetailsProps {
  functionData: FunctionData;
}

export const FunctionAnalysisDetails = ({ functionData }: FunctionAnalysisDetailsProps) => {
  const {
    name,
    address,
    label,
    arch,
    graph_level,
    crypto_signatures,
    op_category_counts,
    data_references,
    entropy_metrics,
    advanced_features,
    instruction_sequence,
    node_level
  } = functionData;

  const getCryptoSignatureColor = (value: number) => {
    if (value > 0) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Code className="w-5 h-5" />
              {name}
            </CardTitle>
            <CardDescription className="mt-1">
              Address: {address} | Architecture: {arch}
            </CardDescription>
          </div>
          <Badge className={
            label === "Crypto" 
              ? "bg-red-100 text-red-800 border-red-200"
              : label === "Non-Crypto"
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-gray-100 text-gray-800 border-gray-200"
          }>
            {label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="opcodes">Opcodes</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="blocks">Blocks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Entropy Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Function Entropy</span>
                      <span className="font-medium">{entropy_metrics.function_byte_entropy.toFixed(3)}</span>
                    </div>
                    <Progress value={(entropy_metrics.function_byte_entropy / 8) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Opcode Entropy</span>
                      <span className="font-medium">{entropy_metrics.opcode_entropy.toFixed(3)}</span>
                    </div>
                    <Progress value={(entropy_metrics.opcode_entropy / 8) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Complexity Density</span>
                      <span className="font-medium">{entropy_metrics.cyclomatic_complexity_density.toFixed(3)}</span>
                    </div>
                    <Progress value={entropy_metrics.cyclomatic_complexity_density * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Data References
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stack Frame</span>
                    <Badge variant="outline">{data_references.stack_frame_size} bytes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">RO Data Refs</span>
                    <Badge variant="outline">{data_references.rodata_refs_count}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">String Refs</span>
                    <Badge variant="outline">{data_references.string_refs_count}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Braces className="w-4 h-4" />
                    Instruction Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Unique N-grams:</span>
                    <span className="ml-2 font-medium">{instruction_sequence.unique_ngram_count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Top Bigrams:</div>
                  <div className="space-y-1">
                    {instruction_sequence.top_5_bigrams.slice(0, 3).map((bigram, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 font-mono">
                        {bigram}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Graph Metrics Tab */}
          <TabsContent value="graph" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{graph_level.num_basic_blocks}</div>
                <div className="text-sm text-muted-foreground mt-1">Basic Blocks</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{graph_level.num_edges}</div>
                <div className="text-sm text-muted-foreground mt-1">Edges</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{graph_level.cyclomatic_complexity}</div>
                <div className="text-sm text-muted-foreground mt-1">Cyclomatic Complexity</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-600">{graph_level.loop_count}</div>
                <div className="text-sm text-muted-foreground mt-1">Loop Count</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Branch Density</div>
                <div className="text-2xl font-bold mb-2">{(graph_level.branch_density * 100).toFixed(1)}%</div>
                <Progress value={graph_level.branch_density * 100} />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Avg Block Size</div>
                <div className="text-2xl font-bold mb-2">{graph_level.average_block_size.toFixed(1)}</div>
                <Progress value={Math.min(graph_level.average_block_size / 100 * 100, 100)} />
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Loop Depth</div>
                <div className="text-2xl font-bold mb-2">{graph_level.loop_depth}</div>
                <Progress value={Math.min(graph_level.loop_depth / 10 * 100, 100)} />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">Strongly Connected Components</div>
              <div className="text-3xl font-bold text-blue-700">{graph_level.strongly_connected_components}</div>
              <p className="text-sm text-blue-600 mt-1">Indicates code structure and potential recursion</p>
            </div>
          </TabsContent>

          {/* Crypto Signatures Tab */}
          <TabsContent value="crypto" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={crypto_signatures.has_aes_sbox > 0 ? "border-red-300 " : ""}>
                <CardHeader className="pb-3 ">
                  <CardTitle className="text-sm">AES S-Box</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {crypto_signatures.has_aes_sbox > 0 ? "✓" : "✗"}
                  </div>
                  <Badge className={getCryptoSignatureColor(crypto_signatures.has_aes_sbox)}>
                    {crypto_signatures.has_aes_sbox > 0 ? "Detected" : "Not Found"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={crypto_signatures.has_aes_rcon > 0 ? "border-red-300 " : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">AES RCON</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {crypto_signatures.has_aes_rcon > 0 ? "✓" : "✗"}
                  </div>
                  <Badge className={getCryptoSignatureColor(crypto_signatures.has_aes_rcon)}>
                    {crypto_signatures.has_aes_rcon > 0 ? "Detected" : "Not Found"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={crypto_signatures.has_sha_constants > 0 ? "border-red-300 " : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">SHA Constants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {crypto_signatures.has_sha_constants > 0 ? "✓" : "✗"}
                  </div>
                  <Badge className={getCryptoSignatureColor(crypto_signatures.has_sha_constants)}>
                    {crypto_signatures.has_sha_constants > 0 ? "Detected" : "Not Found"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={crypto_signatures.rsa_bigint_detected > 0 ? "border-red-300 " : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">RSA BigInt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {crypto_signatures.rsa_bigint_detected > 0 ? "✓" : "✗"}
                  </div>
                  <Badge className={getCryptoSignatureColor(crypto_signatures.rsa_bigint_detected)}>
                    {crypto_signatures.rsa_bigint_detected > 0 ? "Detected" : "Not Found"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Opcodes Tab */}
          <TabsContent value="opcodes" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operation Ratios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>XOR Ratio</span>
                      <span className="font-medium">{(op_category_counts.xor_ratio * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={op_category_counts.xor_ratio * 100} className="h-2 bg-red-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Add Ratio</span>
                      <span className="font-medium">{(op_category_counts.add_ratio * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={op_category_counts.add_ratio * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rotate Ratio</span>
                      <span className="font-medium">{(op_category_counts.rotate_ratio * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={op_category_counts.rotate_ratio * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Logical Ratio</span>
                      <span className="font-medium">{(op_category_counts.logical_ratio * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={op_category_counts.logical_ratio * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Load/Store Ratio</span>
                      <span className="font-medium">{(op_category_counts.load_store_ratio * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={op_category_counts.load_store_ratio * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operation Counts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Arithmetic Ops</span>
                    <Badge variant="outline">{op_category_counts.arithmetic_ops}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Bitwise Ops</span>
                    <Badge variant="outline">{op_category_counts.bitwise_ops}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2  border border-red-200 rounded">
                    <span className="text-sm font-medium text-red-800">Crypto-like Ops</span>
                    <Badge className="bg-red-100 text-red-800 border-red-200">{op_category_counts.crypto_like_ops}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Features Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AES Specific */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    AES Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>S-Box Present:</span>
                    <Badge variant={advanced_features.has_aes_sbox ? "destructive" : "outline"}>
                      {advanced_features.has_aes_sbox ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>RCON Present:</span>
                    <Badge variant={advanced_features.has_aes_rcon ? "destructive" : "outline"}>
                      {advanced_features.has_aes_rcon ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>S-Box Match Score:</span>
                    <span className="font-medium">{advanced_features.aes_sbox_match_score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MixColumns Pattern:</span>
                    <span className="font-medium">{advanced_features.mixcolumns_pattern_score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key Expansion:</span>
                    <Badge variant={advanced_features.key_expansion_detection ? "destructive" : "outline"}>
                      {advanced_features.key_expansion_detection ? "Detected" : "Not Found"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>T-Box Detected:</span>
                    <Badge variant={advanced_features.tbox_detected ? "destructive" : "outline"}>
                      {advanced_features.tbox_detected ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* SHA Specific */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    SHA Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Init Constants:</span>
                    <Badge variant="outline">{advanced_features.sha_init_constants_hits}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>K-Table Hits:</span>
                    <Badge variant="outline">{advanced_features.sha_k_table_hits}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rotation Patterns:</span>
                    <Badge variant={advanced_features.sha_rotation_patterns > 0 ? "destructive" : "outline"}>
                      {advanced_features.sha_rotation_patterns}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* RSA/BigInt */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Binary className="w-4 h-4" />
                    RSA/BigInt Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>BigInt Operations:</span>
                    <Badge variant="outline">{advanced_features.bigint_op_count}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>BigInt Width:</span>
                    <Badge variant="outline">{advanced_features.bigint_width} bits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Montgomery Ops:</span>
                    <Badge variant="outline">{advanced_features.montgomery_op_count}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>ModExp Density:</span>
                    <span className="font-medium">{advanced_features.modexp_op_density.toFixed(3)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* ECC/Curve25519 */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    ECC/Stream Cipher
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Curve25519 Constants:</span>
                    <Badge variant={advanced_features.curve25519_constant_detection ? "destructive" : "outline"}>
                      {advanced_features.curve25519_constant_detection ? "Detected" : "Not Found"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Ladder Steps:</span>
                    <Badge variant="outline">{advanced_features.ladder_step_count}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>CSWAP Patterns:</span>
                    <Badge variant="outline">{advanced_features.cswap_patterns}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>QuarterRound Score:</span>
                    <Badge variant="outline">{advanced_features.quarterround_score}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Bitwise Mix Ops:</span>
                    <Badge variant={advanced_features.bitwise_mix_operations > 0 ? "destructive" : "outline"}>
                      {advanced_features.bitwise_mix_operations}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Table Analysis */}
              <Card className="border-l-4 border-l-yellow-500 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Table Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{advanced_features.num_large_tables}</div>
                      <div className="text-xs text-muted-foreground mt-1">Large Tables</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{advanced_features.table_entropy_score.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Table Entropy</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{advanced_features.aes_sbox_match_score.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">S-Box Match</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Basic Blocks Tab */}
          <TabsContent value="blocks" className="space-y-4 mt-4">
            <div className="space-y-3">
              {node_level && node_level.slice(0, 10).map((block, idx) => (
                <Card key={idx} className={block.crypto_constant_hits > 0 ? "border-red-300 /50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono">{block.address}</CardTitle>
                      <div className="flex gap-2">
                        {block.crypto_constant_hits > 0 && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            {block.crypto_constant_hits} crypto hits
                          </Badge>
                        )}
                        {block.table_lookup_presence && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Table Lookup
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Instructions:</span>
                        <span className="ml-2 font-medium">{block.instruction_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Entropy:</span>
                        <span className="ml-2 font-medium">{block.immediate_entropy.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bitwise Density:</span>
                        <span className="ml-2 font-medium">{(block.bitwise_op_density * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Crypto Hits:</span>
                        <span className="ml-2 font-medium text-red-600">{block.crypto_constant_hits}</span>
                      </div>
                    </div>

                    {/* Opcode Histogram */}
                    {block.opcode_histogram && Object.keys(block.opcode_histogram).length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-2">Opcode Distribution:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(block.opcode_histogram)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 8)
                            .map(([opcode, count]) => (
                              <Badge key={opcode} variant="outline" className="text-xs">
                                {opcode}: {count}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Constant Flags */}
                    {block.constant_flags && Object.keys(block.constant_flags).length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-2">Detected Constants:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(block.constant_flags)
                            .filter(([, detected]) => detected)
                            .map(([flag]) => (
                              <Badge key={flag} className="bg-red-100 text-red-800 border-red-200 text-xs">
                                {flag}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {node_level && node_level.length > 10 && (
                <p className="text-sm text-muted-foreground text-center p-4">
                  Showing first 10 of {node_level.length} basic blocks
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
