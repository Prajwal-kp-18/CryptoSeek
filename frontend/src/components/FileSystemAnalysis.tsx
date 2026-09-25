import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileCode, 
  Shield, 
  Key, 
  AlertTriangle, 
  Package, 
  FileText,
  Lock,
  Binary,
  Library,
  FolderOpen
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CryptoLibrary {
  file?: string;        // Backend uses 'file' field
  filename?: string;    // For compatibility
  path: string;
  size: number;
  matched_pattern?: string;
}

interface Certificate {
  file?: string;
  filename?: string;
  path: string;
  size: number;
}

interface PrivateKey {
  file?: string;
  filename?: string;
  path: string;
  size: number;
}

interface HardcodedSecret {
  file: string;
  line_number: string;
  content: string;
  pattern: string;
  severity: string;
}

interface BinaryFile {
  filename: string;
  path: string;
  directory: string;
}

interface FeatureExtractionResults {
  job_id?: string;
  scan_path?: string;
  status?: string;
  crypto_libraries?: {
    so_files?: CryptoLibrary[];
    a_files?: CryptoLibrary[];
    o_files?: CryptoLibrary[];
  };
  ssl_configs?: unknown[];
  certificates?: Certificate[];
  private_keys?: PrivateKey[];
  hardcoded_secrets?: HardcodedSecret[];
  binaries?: BinaryFile[];
  summary?: {
    total_crypto_libraries: number;
    total_configs: number;
    total_certificates: number;
    total_private_keys: number;
    total_secrets: number;
    total_binaries: number;
  };
}

interface FileSystemAnalysisProps {
  featureResults: Record<string, unknown> | null;
}

export const FileSystemAnalysis: React.FC<FileSystemAnalysisProps> = ({ featureResults }) => {
  if (!featureResults) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center py-10">
          <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold">No Filesystem Data Available</h3>
          <p className="text-muted-foreground">
            This analysis did not include filesystem extraction or the data is not yet available.
          </p>
        </div>
      </Card>
    );
  }

  // Type cast the data safely
  const data = featureResults as FeatureExtractionResults;

  // Helper function to get filename from either 'file' or 'filename' field, or extract from path
  const getFileName = (item: { file?: string; filename?: string; path?: string }): string => {
    // First try 'file' field (backend uses this)
    if (item.file) return item.file;
    // Then try 'filename' field
    if (item.filename) return item.filename;
    // Finally extract from path if available
    if (item.path) {
      const parts = item.path.split('/');
      return parts[parts.length - 1] || 'Unknown';
    }
    return 'Unknown';
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    if (!filename || filename === 'Unknown') return 'N/A';
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return 'N/A';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const cryptoLibraries = [
    ...(data.crypto_libraries?.so_files || []),
    ...(data.crypto_libraries?.a_files || []),
    ...(data.crypto_libraries?.o_files || [])
  ];

  const certificates = data.certificates || [];
  const privateKeys = data.private_keys || [];
  const hardcodedSecrets = data.hardcoded_secrets || [];
  const binaries = data.binaries || [];
  const summary = data.summary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Crypto Libraries</p>
                <p className="text-2xl font-bold">{summary.total_crypto_libraries}</p>
              </div>
              <Library className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Certificates</p>
                <p className="text-2xl font-bold">{summary.total_certificates}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Private Keys</p>
                <p className="text-2xl font-bold text-red-500">{summary.total_private_keys}</p>
              </div>
              <Key className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Secrets Found</p>
                <p className="text-2xl font-bold text-orange-500">{summary.total_secrets}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Binaries</p>
                <p className="text-2xl font-bold">{summary.total_binaries}</p>
              </div>
              <Binary className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">SSL Configs</p>
                <p className="text-2xl font-bold">{summary.total_configs}</p>
              </div>
              <FileText className="w-8 h-8 text-cyan-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Scan Path */}
      {data.scan_path && (
        <Card className="p-4 bg-card border-border">
          <p className="text-sm font-medium text-muted-foreground mb-2">Scan Path</p>
          <p className="font-mono text-xs break-all text-primary">{data.scan_path}</p>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="secrets" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="secrets">
            Secrets {hardcodedSecrets.length > 0 && `(${hardcodedSecrets.length})`}
          </TabsTrigger>
          <TabsTrigger value="libraries">
            Libraries {cryptoLibraries.length > 0 && `(${cryptoLibraries.length})`}
          </TabsTrigger>
          <TabsTrigger value="certificates">
            Certificates {certificates.length > 0 && `(${certificates.length})`}
          </TabsTrigger>
          <TabsTrigger value="keys">
            Keys {privateKeys.length > 0 && `(${privateKeys.length})`}
          </TabsTrigger>
          <TabsTrigger value="binaries">
            Binaries {binaries.length > 0 && `(${binaries.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Hardcoded Secrets Tab */}
        <TabsContent value="secrets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Hardcoded Secrets & Credentials
              </CardTitle>
              <CardDescription>
                Potential security risks found in configuration files and scripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hardcodedSecrets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No hardcoded secrets detected</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {hardcodedSecrets.map((secret, idx) => (
                      <Card key={idx} className="p-4 bg-secondary/30 border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={getSeverityColor(secret.severity || 'low')}
                              >
                                {(secret.severity || 'unknown').toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Pattern: {secret.pattern || 'N/A'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              File: <span className="font-mono">{secret.file?.split('/').pop() || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Line: {secret.line_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-background/50 rounded p-3 mt-2">
                          <p className="font-mono text-xs break-all">{secret.content || 'N/A'}</p>
                        </div>
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                            Full path
                          </summary>
                          <p className="font-mono text-xs break-all mt-1 text-muted-foreground">
                            {secret.file || 'N/A'}
                          </p>
                        </details>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Libraries Tab */}
        <TabsContent value="libraries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="w-5 h-5 text-blue-500" />
                Cryptographic Libraries
              </CardTitle>
              <CardDescription>
                Shared objects (.so), archives (.a), and object files (.o) containing crypto implementations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cryptoLibraries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3" />
                  <p>No cryptographic libraries found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {cryptoLibraries.map((lib, idx) => {
                      const fileName = getFileName(lib);
                      const fileExt = getFileExtension(fileName);
                      
                      return (
                        <Card key={idx} className="p-4 bg-secondary/30 border-border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileCode className="w-4 h-4 text-blue-500" />
                                <p className="font-semibold">{fileName}</p>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Size: <span className="text-primary">{formatBytes(lib.size || 0)}</span></span>
                                <span>Type: <span className="text-primary">{fileExt}</span></span>
                              </div>
                              {lib.matched_pattern && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Pattern: {lib.matched_pattern}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                              Full path
                            </summary>
                            <p className="font-mono text-xs break-all mt-1 text-muted-foreground">
                              {lib.path || 'N/A'}
                            </p>
                          </details>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                SSL/TLS Certificates
              </CardTitle>
              <CardDescription>
                X.509 certificates and certificate bundles found in the filesystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3" />
                  <p>No certificates found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {certificates.map((cert, idx) => {
                      const fileName = getFileName(cert);
                      
                      return (
                        <Card key={idx} className="p-4 bg-secondary/30 border-border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <p className="font-semibold">{fileName}</p>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Size: <span className="text-primary">{formatBytes(cert.size || 0)}</span></span>
                              </div>
                            </div>
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                              Full path
                            </summary>
                            <p className="font-mono text-xs break-all mt-1 text-muted-foreground">
                              {cert.path || 'N/A'}
                            </p>
                          </details>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Private Keys Tab */}
        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-red-500" />
                Private Keys
              </CardTitle>
              <CardDescription>
                Private key files that should be protected and never hardcoded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {privateKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No private keys found (Good!)</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {privateKeys.map((key, idx) => {
                      const fileName = getFileName(key);
                      
                      return (
                        <Card key={idx} className="p-4 bg-red-500/5 border-red-500/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <p className="font-semibold text-red-500">{fileName}</p>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Size: <span className="text-primary">{formatBytes(key.size || 0)}</span></span>
                              </div>
                            </div>
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                              Full path
                            </summary>
                            <p className="font-mono text-xs break-all mt-1 text-muted-foreground">
                              {key.path || 'N/A'}
                            </p>
                          </details>
                          <div className="mt-3 p-2 bg-red-500/10 rounded">
                            <p className="text-xs text-red-500">
                              ⚠️ Critical: Private keys should never be embedded in firmware
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Binaries Tab */}
        <TabsContent value="binaries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Binary className="w-5 h-5 text-purple-500" />
                Extracted Binaries
              </CardTitle>
              <CardDescription>
                Executable files and binaries found in the filesystem (showing first 100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {binaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCode className="w-12 h-12 mx-auto mb-3" />
                  <p>No binaries found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {binaries.slice(0, 100).map((binary, idx) => (
                      <Card key={idx} className="p-3 bg-secondary/30 border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Binary className="w-4 h-4 text-purple-500" />
                            <p className="font-mono text-sm">{binary.filename || 'Unknown'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {binary.directory || 'N/A'}
                          </Badge>
                        </div>
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                            Full path
                          </summary>
                          <p className="font-mono text-xs break-all mt-1 text-muted-foreground">
                            {binary.path || 'N/A'}
                          </p>
                        </details>
                      </Card>
                    ))}
                    {binaries.length > 100 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Showing 100 of {binaries.length} binaries
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
