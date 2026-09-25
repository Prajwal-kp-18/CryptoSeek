import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface OpcodeAnalysisProps {
  opcodeHistogram: Record<string, number>;
  opcodeRatios: {
    add: number;
    xor: number;
    rotate: number;
    logical: number;
    load_store: number;
    multiply: number;
  };
  instructionSequence: {
    unique_ngram_count: number;
    top_5_bigrams: string[];
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const OpcodeAnalysis = ({ opcodeHistogram, opcodeRatios, instructionSequence }: OpcodeAnalysisProps) => {
  // Prepare data for histogram
  const histogramData = Object.entries(opcodeHistogram)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 opcodes

  // Prepare data for ratio pie chart
  const ratioData = Object.entries(opcodeRatios)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value: parseFloat((value * 100).toFixed(2))
    }));

  return (
    <div className="space-y-6">
      {/* Opcode Histogram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Opcode Distribution
          </CardTitle>
          <CardDescription>
            Most frequently used opcodes in the function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '12px' }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operation Ratio Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Operation Ratios
            </CardTitle>
            <CardDescription>
              Percentage distribution of operation types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ratioData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={ratioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No operation ratio data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruction Sequences */}
        <Card>
          <CardHeader>
            <CardTitle>Instruction Patterns</CardTitle>
            <CardDescription>
              Common instruction sequences (bigrams)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Unique N-grams</div>
                <div className="text-3xl font-bold">{instructionSequence.unique_ngram_count}</div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Top Instruction Bigrams:</div>
                <div className="space-y-2">
                  {instructionSequence.top_5_bigrams.map((bigram, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <code className="font-mono text-sm flex-1">{bigram}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ratios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Operation Metrics</CardTitle>
          <CardDescription>
            Comprehensive breakdown of operation type usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(opcodeRatios).map(([operation, ratio]) => (
              <div key={operation} className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1 uppercase">
                  {operation.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {(ratio * 100).toFixed(2)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
