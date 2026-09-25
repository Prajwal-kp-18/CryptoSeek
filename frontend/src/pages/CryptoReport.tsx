import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldCheck, Activity, Cpu, FileCode } from "lucide-react";

const CryptoReport = () => {
  // Mock data derived from the log
  const reportData = {
    primaryArchitecture: {
      name: "SPN",
      score: 200,
      confidence: "Medium",
    },
    scores: [
      {
        name: "SPN",
        score: 200,
        details: ["Detected 4 potential S-Box tables"],
      },
      {
        name: "Feistel",
        score: 70,
        details: [
          "High Data Movement (36.1%) with ARX ops - Typical of Feistel",
          "Explicit register swaps detected",
        ],
      },
      { name: "ARX", score: 20, details: ["Balanced Mix of Add/Rotate/Xor"] },
      { name: "Lai-Massey", score: 0, details: [] },
      { name: "Sponge", score: 0, details: [] },
    ],
    debugInfo: {
      loopOpCounts: {
        MOV_OP: 797,
        ARX_ADD: 163,
        ARX_XOR: 34,
        ARX_ROT: 46,
        SWAP_OP: 1,
      },
      loopOps: 2209,
      arxOps: { count: 243, ratio: 0.11 },
      movOps: { count: 797, ratio: 0.36 },
      sBoxCandidates: 4,
    },
    testResult: {
      test: "CSPN-64 test",
      plain: "0123456789ABCDEF",
      cipher: "8AAB8FF0EFE21A58",
      decrypt: "0123456789ABCDEF",
    },
    comparativeSummary: [
      {
        feature: "Component",
        spn: "S-Boxes + P-Boxes",
        feistel: "Split halves",
        arx: "Add, Rotate, XOR",
        sponge: "Absorb & Squeeze",
      },
    ],
    conclusion: "Binary likely implements a SPN-based algorithm.",
  };

  const maxScore = Math.max(...reportData.scores.map((s) => s.score));

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Architectural Classification Report
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Target: qiling_analysis/tests/proprietery_files/cspn.elf
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-lg py-1 px-4 border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
            Analysis Complete
          </Badge>
        </div>

        {/* Primary Result & Conclusion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-emerald-500/20 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Primary Architecture: {reportData.primaryArchitecture.name}
              </CardTitle>
              <CardDescription>
                Confidence Score: {reportData.primaryArchitecture.score}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-200">
                <AlertTitle className="text-emerald-400 font-semibold">
                  Conclusion
                </AlertTitle>
                <AlertDescription className="text-lg">
                  {reportData.conclusion}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Test Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-mono">
              <div className="space-y-1">
                <div className="text-muted-foreground">Test Case</div>
                <div className="font-semibold text-foreground">
                  {reportData.testResult.test}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Plaintext</div>
                <div className="text-blue-300">
                  {reportData.testResult.plain}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Ciphertext</div>
                <div className="text-orange-300">
                  {reportData.testResult.cipher}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Decrypted</div>
                <div className="text-green-300">
                  {reportData.testResult.decrypt}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Classification Scores</CardTitle>
            <CardDescription>
              Breakdown of architectural probability scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {reportData.scores.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">{item.name}</span>
                  <span className="text-muted-foreground">{item.score}</span>
                </div>
                <Progress
                  value={(item.score / maxScore) * 100}
                  className="h-3"
                />
                {item.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Technical Details & Debug Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                Opcode Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Loop Ops
                  </div>
                  <div className="text-2xl font-bold">
                    {reportData.debugInfo.loopOps}
                  </div>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    S-Box Candidates
                  </div>
                  <div className="text-2xl font-bold text-orange-400">
                    {reportData.debugInfo.sBoxCandidates}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ARX Operations</span>
                  <span className="text-muted-foreground">
                    {reportData.debugInfo.arxOps.count} (
                    {Math.round(reportData.debugInfo.arxOps.ratio * 100)}%)
                  </span>
                </div>
                <Progress
                  value={reportData.debugInfo.arxOps.ratio * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>MOV Operations</span>
                  <span className="text-muted-foreground">
                    {reportData.debugInfo.movOps.count} (
                    {Math.round(reportData.debugInfo.movOps.ratio * 100)}%)
                  </span>
                </div>
                <Progress
                  value={reportData.debugInfo.movOps.ratio * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-400" />
                Instruction Counts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(reportData.debugInfo.loopOpCounts).map(
                    ([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-sm">
                          {key}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {value}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Comparative Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Comparative Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>SPN (AES)</TableHead>
                  <TableHead>Feistel (DES)</TableHead>
                  <TableHead>ARX (ChaCha)</TableHead>
                  <TableHead>Sponge (SHA-3)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.comparativeSummary.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell>{row.spn}</TableCell>
                    <TableCell className="text-emerald-400 font-semibold">
                      {row.feistel}
                    </TableCell>
                    <TableCell>{row.arx}</TableCell>
                    <TableCell>{row.sponge}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CryptoReport;
