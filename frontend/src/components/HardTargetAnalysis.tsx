import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Key, 
  FileSearch, 
  Cpu, 
  Network,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Brain,
  Hash,
  FileType,
  Server,
  Activity,
  Target,
  FileText,
  ArrowDown,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface HardTargetAnalysisProps {
  hardTargetInfo: Record<string, unknown>;
  jobData?: Record<string, unknown>;
}

export const HardTargetAnalysis = ({ hardTargetInfo, jobData }: HardTargetAnalysisProps) => {
  if (!hardTargetInfo) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Hard Target Data</AlertTitle>
        <AlertDescription>
          Hard target analysis information is not available for this binary.
        </AlertDescription>
      </Alert>
    );
  }

  const cryptoStrings = hardTargetInfo.crypto_strings as Record<string, unknown> | undefined;
  const llmAnalysis = cryptoStrings?.llm_analysis as Record<string, unknown> | undefined;
  const categories = cryptoStrings?.categories as Record<string, unknown> | undefined;
  const summary = cryptoStrings?.summary as Record<string, unknown> | undefined;

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case "high":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      <Alert className="border-orange-500/20 bg-orange-500/5">
        <Target className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-500">Hard Target Analysis - Path C</AlertTitle>
        <AlertDescription>
          This binary was identified as a hard target (encrypted, packed, or unsupported format).
          Cryptographic string analysis has been performed to extract available information.
        </AlertDescription>
      </Alert>

      {/* LLM Verdict Card */}
      {llmAnalysis?.verdict && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI-Powered Security Assessment
            </CardTitle>
            <CardDescription>Automated analysis powered by LLM ({String((llmAnalysis as Record<string, unknown>).llm_model || "unknown")})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Verdict Summary</h4>
              <p className="text-lg font-medium">{String(((llmAnalysis.verdict as Record<string, unknown>).summary || "No summary available"))}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge variant="outline" className={getRiskColor(String((llmAnalysis.verdict as Record<string, unknown>).risk_level || ""))}>
                  {String((llmAnalysis.verdict as Record<string, unknown>).risk_level || "UNKNOWN").toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className={`text-lg font-semibold ${getConfidenceColor(String((llmAnalysis.verdict as Record<string, unknown>).confidence || ""))}`}>
                  {String((llmAnalysis.verdict as Record<string, unknown>).confidence || "UNKNOWN").toUpperCase()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-lg font-semibold">{Number((llmAnalysis as Record<string, unknown>).tokens_used) || 0}</p>
              </div>
            </div>

            {(llmAnalysis.verdict as Record<string, unknown>).key_findings && Array.isArray((llmAnalysis.verdict as Record<string, unknown>).key_findings) && ((llmAnalysis.verdict as Record<string, string[]>).key_findings || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Key Findings</h4>
                <ul className="space-y-2">
                  {((llmAnalysis.verdict as Record<string, string[]>).key_findings || []).map((finding: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      <span className="text-sm">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Crypto Strings Overview */}
      {cryptoStrings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5" />
              Crypto String Detection Overview
            </CardTitle>
            <CardDescription>
              {(cryptoStrings as Record<string, string>)?.status === "success" ? "Successfully extracted and categorized cryptographic strings" : "Analysis incomplete"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-primary">{Number((cryptoStrings as Record<string, number>)?.total_strings) || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Strings</p>
              </div>

              <div className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-green-500">{Number((cryptoStrings as Record<string, number>)?.crypto_strings_count) || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Crypto Strings</p>
              </div>

              <div className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-blue-500">{Number((summary as Record<string, number>)?.total_categories) || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Categories</p>
              </div>

              <div className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-purple-500">
                  {(cryptoStrings as Record<string, boolean>)?.crypto_detected ? "YES" : "NO"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Crypto Detected</p>
              </div>
            </div>

            {summary?.category_counts && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Category Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(summary.category_counts as Record<string, number>).map(([category, count]: [string, number]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category.replace(/_/g, " ")}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <Progress 
                        value={(count / (Number((cryptoStrings as Record<string, number>)?.crypto_strings_count) || 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Crypto Libraries Detection */}
      {llmAnalysis?.crypto_libraries && (
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Detected Cryptographic Libraries
            </CardTitle>
            <CardDescription>
              Identified crypto libraries, versions, and source file references
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Detected Libraries */}
            {(llmAnalysis.crypto_libraries as Record<string, unknown>).detected && 
             Array.isArray((llmAnalysis.crypto_libraries as Record<string, unknown>).detected) && 
             ((llmAnalysis.crypto_libraries as Record<string, string[]>).detected || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Detected Libraries
                </h4>
                <div className="flex flex-wrap gap-3">
                  {((llmAnalysis.crypto_libraries as Record<string, string[]>).detected || []).map((lib: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-base px-4 py-2 bg-blue-100 text-blue-800 border-blue-200">
                      {lib}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Library Version */}
            {(llmAnalysis.crypto_libraries as Record<string, unknown>).version && (
              <div className="p-4 bg-secondary/30 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Library Version</p>
                    <p className="text-xl font-bold text-blue-700">
                      {String((llmAnalysis.crypto_libraries as Record<string, unknown>).version)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Source Files */}
            {(llmAnalysis.crypto_libraries as Record<string, unknown>).source_files && 
             Array.isArray((llmAnalysis.crypto_libraries as Record<string, unknown>).source_files) && 
             ((llmAnalysis.crypto_libraries as Record<string, string[]>).source_files || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <FileType className="w-4 h-4" />
                  Source File References
                </h4>
                <ScrollArea className="h-[200px] w-full rounded-md border border-blue-200 p-4 bg-secondary/20">
                  <div className="space-y-2">
                    {((llmAnalysis.crypto_libraries as Record<string, string[]>).source_files || []).map((file: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded transition-colors">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <code className="text-sm font-mono text-blue-800">{file}</code>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray((llmAnalysis.crypto_libraries as Record<string, unknown>).detected) 
                    ? ((llmAnalysis.crypto_libraries as Record<string, string[]>).detected || []).length 
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Libraries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(llmAnalysis.crypto_libraries as Record<string, unknown>).version ? "1" : "0"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Version Info</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray((llmAnalysis.crypto_libraries as Record<string, unknown>).source_files)
                    ? ((llmAnalysis.crypto_libraries as Record<string, string[]>).source_files || []).length
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Source Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed LLM Analysis Tabs */}
      {llmAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Detailed Cryptographic Analysis
            </CardTitle>
            <CardDescription>AI-extracted cryptographic primitives and security features</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="crypto" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="crypto">Crypto Algorithms</TabsTrigger>
                <TabsTrigger value="public-key">Public Key</TabsTrigger>
                <TabsTrigger value="network">Network & TLS</TabsTrigger>
                <TabsTrigger value="security">Security Features</TabsTrigger>
                {/* <TabsTrigger value="architecture">Architecture</TabsTrigger> */}
                <TabsTrigger value="behavior">Behavioral</TabsTrigger>
              </TabsList>

              {/* Crypto Algorithms Tab */}
              <TabsContent value="crypto" className="space-y-4">
                <CryptoAlgorithmsSection algorithms={(llmAnalysis as Record<string, unknown>).crypto_algorithms as Record<string, unknown> || {}} />
              </TabsContent>

              {/* Public Key Tab */}
              <TabsContent value="public-key" className="space-y-4">
                <PublicKeySection publicKey={(llmAnalysis as Record<string, unknown>).public_key_algorithms as Record<string, unknown> || {}} />
              </TabsContent>

              {/* Network & TLS Tab */}
              <TabsContent value="network" className="space-y-4">
                <NetworkTLSSection 
                  tlsVersions={((llmAnalysis as Record<string, unknown>).tls_versions as string[]) || []}
                  certificates={((llmAnalysis as Record<string, unknown>).certificate_blocks as string[]) || []}
                  cryptoLibraries={(llmAnalysis as Record<string, unknown>).crypto_libraries as Record<string, unknown> || {}}
                  networkProtocols={(llmAnalysis as Record<string, unknown>).network_protocols as Record<string, unknown> || {}}
                  handshakeStates={((llmAnalysis as Record<string, unknown>).tls_handshake_states as string[]) || []}
                  certAuthorities={(llmAnalysis as Record<string, unknown>).certificate_authorities as Record<string, unknown> || {}}
                />
              </TabsContent>

              {/* Security Features Tab */}
              <TabsContent value="security" className="space-y-4">
                <SecurityFeaturesSection 
                  securityFeatures={(llmAnalysis as Record<string, unknown>).security_features as Record<string, unknown> || {}}
                  authentication={(llmAnalysis as Record<string, unknown>).authentication as Record<string, unknown> || {}}
                />
              </TabsContent>

              {/* Architecture Tab */}
              {/* <TabsContent value="architecture" className="space-y-4">
                <ArchitectureSection architecture={(llmAnalysis as Record<string, unknown>).architecture_indicators as Record<string, unknown> || {}} />
              </TabsContent> */}

              {/* Behavioral Tab */}
              <TabsContent value="behavior" className="space-y-4">
                <BehavioralSection behavioral={(llmAnalysis as Record<string, unknown>).behavioral_analysis as Record<string, unknown> || {}} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Raw Crypto Strings Sample */}
      {cryptoStrings && Array.isArray((cryptoStrings as Record<string, unknown>).crypto_strings) && ((cryptoStrings as Record<string, string[]>).crypto_strings?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileType className="w-5 h-5" />
              Extracted Crypto Strings
            </CardTitle>
            <CardDescription>
              Showing first 50 of {(cryptoStrings as Record<string, string[]>).crypto_strings?.length || 0} detected strings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-1 font-mono text-sm">
                {((cryptoStrings as Record<string, string[]>).crypto_strings || []).slice(0, 50).map((str: string, idx: number) => (
                  <div key={idx} className="py-1 px-2 hover:bg-secondary/50 rounded">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Final Verdict Summary */}
      {llmAnalysis?.verdict && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Brain className="w-6 h-6 text-primary" />
                Analysis Verdict & Summary
              </CardTitle>
              <Badge variant="outline" className={getRiskColor(String((llmAnalysis.verdict as Record<string, unknown>).risk_level || ""))}>
                {String((llmAnalysis.verdict as Record<string, unknown>).risk_level || "UNKNOWN").toUpperCase()}
              </Badge>
            </div>
            <CardDescription className="text-base mt-2">
              Comprehensive security assessment powered by AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Statement */}
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                  <p className="text-base leading-relaxed">
                    {String(((llmAnalysis.verdict as Record<string, unknown>).summary || "No summary available"))}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence & Risk Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis Confidence</p>
                    <p className={`text-2xl font-bold ${getConfidenceColor(String((llmAnalysis.verdict as Record<string, unknown>).confidence || ""))}`}>
                      {String((llmAnalysis.verdict as Record<string, unknown>).confidence || "UNKNOWN").toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Assessment</p>
                    <p className={`text-2xl font-bold ${getConfidenceColor(String((llmAnalysis.verdict as Record<string, unknown>).risk_level || ""))}`}>
                      {String((llmAnalysis.verdict as Record<string, unknown>).risk_level || "UNKNOWN").toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Findings */}
            {(llmAnalysis.verdict as Record<string, unknown>).key_findings && 
             Array.isArray((llmAnalysis.verdict as Record<string, unknown>).key_findings) && 
             ((llmAnalysis.verdict as Record<string, string[]>).key_findings || []).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Key Findings
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {((llmAnalysis.verdict as Record<string, string[]>).key_findings || []).map((finding: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-4 bg-background border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed pt-1">{finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Status Footer */}
            {/* <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>Analysis Status: <span className="font-semibold text-foreground">{String((llmAnalysis as Record<string, unknown>).status || "unknown").toUpperCase()}</span></span>
                </div>
                {(llmAnalysis as Record<string, unknown>).llm_model && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    <span>Powered by: <span className="font-semibold text-foreground">{String((llmAnalysis as Record<string, unknown>).llm_model)}</span></span>
                  </div>
                )}
              </div>
            </div> */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper component sections
const CryptoAlgorithmsSection = ({ algorithms }: { algorithms: Record<string, unknown> }) => {
  if (!algorithms) return <EmptyState message="No cryptographic algorithm data available" />;

  return (
    <div className="space-y-4">
      <InfoCard title="Symmetric Encryption" icon={<Lock className="w-4 h-4" />} items={algorithms.symmetric as string[]} />
      <InfoCard title="Hash Functions" icon={<Hash className="w-4 h-4" />} items={algorithms.hashes as string[]} />
      <InfoCard title="MAC & KDF" icon={<Key className="w-4 h-4" />} items={algorithms.mac_kdf as string[]} />
    </div>
  );
};

const PublicKeySection = ({ publicKey }: { publicKey: Record<string, unknown> }) => {
  if (!publicKey) return <EmptyState message="No public key algorithm data available" />;

  return (
    <div className="space-y-4">
      <InfoCard title="RSA Algorithms" icon={<Key className="w-4 h-4" />} items={publicKey.rsa as string[]} />
      <InfoCard title="ECDSA & ECDH" icon={<Activity className="w-4 h-4" />} items={publicKey.ecdsa_ecdh as string[]} />
    </div>
  );
};

const NetworkTLSSection = ({ 
  tlsVersions, 
  certificates, 
  cryptoLibraries, 
  networkProtocols,
  handshakeStates,
  certAuthorities
}: {
  tlsVersions: string[];
  certificates: string[];
  cryptoLibraries: Record<string, unknown>;
  networkProtocols: Record<string, unknown>;
  handshakeStates: string[];
  certAuthorities: Record<string, unknown>;
}) => {
  return (
    <div className="space-y-4">
      <InfoCard title="TLS/SSL Versions" icon={<Shield className="w-4 h-4" />} items={tlsVersions} />
      {/* <InfoCard title="Certificate Blocks" icon={<FileType className="w-4 h-4" />} items={certificates} /> */}
      
      {/* TLS Handshake States Flow - Only show if states exist */}
      {handshakeStates && handshakeStates.length > 0 && (
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="w-4 h-4" />
              TLS Handshake Flow
            </CardTitle>
            <CardDescription>
              Detected TLS handshake states in sequence
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop view - horizontal flow */}
            <div className="hidden md:flex items-center justify-start gap-3 flex-wrap">
              {handshakeStates.map((state, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-center whitespace-nowrap">{state}</p>
                  </div>
                  {idx < handshakeStates.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile view - vertical flow */}
            <div className="md:hidden flex flex-col items-center gap-3">
              {handshakeStates.map((state, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 w-full">
                  <div className="w-full px-4 py-3 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-center">{state}</p>
                  </div>
                  {idx < handshakeStates.length - 1 && (
                    <ArrowDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-semibold">{handshakeStates.length}</span> handshake states detected
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {cryptoLibraries && (
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" />
              Crypto Libraries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cryptoLibraries.detected && Array.isArray(cryptoLibraries.detected) && cryptoLibraries.detected.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Detected:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(cryptoLibraries.detected as string[]).map((lib: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{lib}</Badge>
                  ))}
                </div>
              </div>
            )}
            {cryptoLibraries.version && (
              <p className="text-sm"><span className="font-semibold">Version:</span> {String(cryptoLibraries.version)}</p>
            )}
            {cryptoLibraries.source_files && Array.isArray(cryptoLibraries.source_files) && cryptoLibraries.source_files.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Source Files:</p>
                <ul className="text-sm text-muted-foreground ml-4 mt-1">
                  {(cryptoLibraries.source_files as string[]).map((file: string, idx: number) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {networkProtocols && (
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network Protocols
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkProtocols.http && Array.isArray(networkProtocols.http) && networkProtocols.http.length > 0 && (
              <div>
                <p className="text-sm font-semibold">HTTP:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(networkProtocols.http as string[]).map((proto: string, idx: number) => (
                    <Badge key={idx} variant="outline">{proto}</Badge>
                  ))}
                </div>
              </div>
            )}
            {networkProtocols.iot && Array.isArray(networkProtocols.iot) && networkProtocols.iot.length > 0 && (
              <div>
                <p className="text-sm font-semibold">IoT:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(networkProtocols.iot as string[]).map((proto: string, idx: number) => (
                    <Badge key={idx} variant="outline">{proto}</Badge>
                  ))}
                </div>
              </div>
            )}
            {networkProtocols.industrial && Array.isArray(networkProtocols.industrial) && networkProtocols.industrial.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Industrial:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(networkProtocols.industrial as string[]).map((proto: string, idx: number) => (
                    <Badge key={idx} variant="outline">{proto}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {certAuthorities && (
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Certificate Authorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {certAuthorities.ca_paths && Array.isArray(certAuthorities.ca_paths) && certAuthorities.ca_paths.length > 0 && (
              <InfoList label="CA Paths" items={certAuthorities.ca_paths as string[]} />
            )}
            {certAuthorities.ca_files && Array.isArray(certAuthorities.ca_files) && certAuthorities.ca_files.length > 0 && (
              <InfoList label="CA Files" items={certAuthorities.ca_files as string[]} />
            )}
            {certAuthorities.certificate_types && Array.isArray(certAuthorities.certificate_types) && certAuthorities.certificate_types.length > 0 && (
              <InfoList label="Certificate Types" items={certAuthorities.certificate_types as string[]} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SecurityFeaturesSection = ({ securityFeatures, authentication }: {
  securityFeatures: Record<string, unknown>;
  authentication: Record<string, unknown>;
}) => {
  return (
    <div className="space-y-4">
      {securityFeatures && (
        <>
          <InfoCard title="Key Exchange" icon={<Key className="w-4 h-4" />} items={securityFeatures.key_exchange as string[]} />
          <InfoCard title="Cipher Modes" icon={<Lock className="w-4 h-4" />} items={securityFeatures.cipher_modes as string[]} />
          <InfoCard title="Extensions" icon={<Zap className="w-4 h-4" />} items={securityFeatures.extensions as string[]} />
          <InfoCard title="Session Management" icon={<Activity className="w-4 h-4" />} items={securityFeatures.session_management as string[]} />
        </>
      )}

      {authentication && (
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {authentication.methods && Array.isArray(authentication.methods) && authentication.methods.length > 0 && (
              <InfoList label="Methods" items={authentication.methods as string[]} />
            )}
            {authentication.tokens && Array.isArray(authentication.tokens) && authentication.tokens.length > 0 && (
              <InfoList label="Tokens" items={authentication.tokens as string[]} />
            )}
            {authentication.algorithms && Array.isArray(authentication.algorithms) && authentication.algorithms.length > 0 && (
              <InfoList label="Algorithms" items={authentication.algorithms as string[]} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ArchitectureSection = ({ architecture }: { architecture: Record<string, unknown> }) => {
  if (!architecture) return <EmptyState message="No architecture data available" />;

  return (
    <Card className="bg-secondary/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Architecture Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Detected Architecture</p>
            <p className="text-lg font-semibold text-primary">
              {(architecture.detected_arch as string)?.toUpperCase() || "UNKNOWN"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className={`text-lg font-semibold ${getConfidenceColor(architecture.confidence as string)}`}>
              {(architecture.confidence as string)?.toUpperCase() || "UNKNOWN"}
            </p>
          </div>
        </div>

        {architecture.evidence && (architecture.evidence as string[]).length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Evidence:</p>
            <ul className="space-y-1">
              {(architecture.evidence as string[]).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span className="font-mono">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BehavioralSection = ({ behavioral }: { behavioral: Record<string, unknown> }) => {
  if (!behavioral) return <EmptyState message="No behavioral analysis data available" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm">Crypto Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">{String(behavioral.crypto_usage || "Unknown")}</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm">Likely Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">{String(behavioral.likely_purpose || "Unknown")}</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-sm">Security Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getRiskColor(String(behavioral.security_level || ""))}>
              {(behavioral.security_level as string)?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {behavioral.concerns && Array.isArray(behavioral.concerns) && behavioral.concerns.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Concerns</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {(behavioral.concerns as string[]).map((concern: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Reusable helper components
const InfoCard = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) => {
  if (!items || items.length === 0) {
    return (
      <Card className="bg-secondary/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <Badge key={idx} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const InfoList = ({ label, items }: { label: string; items: string[] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-semibold">{label}:</p>
      <ul className="text-sm text-muted-foreground ml-4 mt-1">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <Info className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

const getConfidenceColor = (confidence: string) => {
  switch (confidence?.toLowerCase()) {
    case "high":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-orange-500";
    default:
      return "text-gray-500";
  }
};

const getRiskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "low":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    default:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};
