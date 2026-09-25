import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_CONFIG } from '@/config/api';

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete';
}

export interface Job {
  id: string;
  fileName: string;
  hash: string;
  status: 'analyzing' | 'complete' | 'failed';
  severity: 'critical' | 'high' | 'low' | 'safe' | null;
  threats: number | null;
  uploadTime: string;
  analysisTime: string | null;
  fileSize: string;
  fileType: string;
  detectedThreats?: Array<{
    name: string;
    type: string;
    severity: string;
    description: string;
  }>;
}

interface JobsContextType {
  jobs: Job[];
  addJobs: (files: FileUpload[]) => void;
  getJobById: (id: string) => Job | undefined;
  refreshJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

// Backend job interface
interface BackendJob {
  jobId: string;
  fileName: string;
  fileSize: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  routing?: {
    decision: string;
    reason: string;
  };
  progress?: {
    ingest: boolean;
    features: boolean;
    classification: boolean;
  };
}

// Transform backend job to frontend Job interface
function transformBackendJob(backendJob: BackendJob): Job {
  // Map backend status to frontend status
  const statusMap: Record<string, 'analyzing' | 'complete' | 'failed'> = {
    'pending': 'analyzing',
    'ingesting': 'analyzing',
    'ingest_complete': 'analyzing',
    'extracting_features': 'analyzing',
    'features_complete': 'complete',
    'classifying': 'analyzing',
    'complete': 'complete',
    'failed': 'failed'
  };

  const frontendStatus = statusMap[backendJob.status] || 'analyzing';
  
  // Calculate threats based on progress - for now we'll use null since we need classification results
  const threats = backendJob.progress?.classification ? 0 : null;
  
  // Determine severity - will be null until classification is done
  const severity = frontendStatus === 'complete' ? 'safe' : null;

  // Calculate analysis time if complete
  let analysisTime = null;
  if (backendJob.createdAt && backendJob.updatedAt) {
    const duration = backendJob.updatedAt - backendJob.createdAt;
    analysisTime = `${Math.round(duration)}s`;
  }

  return {
    id: backendJob.jobId,
    fileName: backendJob.fileName,
    hash: backendJob.jobId.substring(0, 32), // Use job ID as hash for now
    status: frontendStatus,
    severity,
    threats,
    uploadTime: new Date(backendJob.createdAt * 1000).toISOString(),
    analysisTime,
    fileSize: backendJob.fileSize,
    fileType: backendJob.routing?.decision || 'Unknown',
    detectedThreats: []
  };
}

export const JobsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);

  // Fetch jobs from backend API
  const refreshJobs = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.JOBS}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      
      // Transform backend jobs to frontend format
      const transformedJobs = data.jobs.map(transformBackendJob);
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Keep existing jobs on error
    }
  };

  // Fetch jobs on mount
  useEffect(() => {
    refreshJobs();
    
    // Optionally refresh every 30 seconds
    const interval = setInterval(refreshJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('binary-analyzer-jobs', JSON.stringify(jobs));
  }, [jobs]);

  const addJobs = (files: FileUpload[]) => {
    const newJobs: Job[] = files.map((file, index) => ({
      id: `JOB-${Math.floor(Math.random() * 9000) + 1000}`,
      fileName: file.name,
      hash: generateMockHash(),
      status: 'analyzing' as const,
      severity: null,
      threats: null,
      uploadTime: new Date().toISOString(),
      analysisTime: null,
      fileSize: formatFileSize(file.size),
      fileType: getFileType(file.name)
    }));

    setJobs(prev => [...newJobs, ...prev]);

    // Simulate analysis completion after random time
    newJobs.forEach((job, index) => {
      setTimeout(() => {
        setJobs(prev => prev.map(j => {
          if (j.id === job.id) {
            const severities: Array<'critical' | 'high' | 'low' | 'safe'> = ['critical', 'high', 'low', 'safe'];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const threats = severity === 'safe' ? 0 : Math.floor(Math.random() * 10) + 1;
            
            return {
              ...j,
              status: 'complete' as const,
              severity,
              threats,
              analysisTime: `${Math.floor(Math.random() * 40) + 20}s`,
              detectedThreats: threats > 0 ? generateMockThreats(threats) : []
            };
          }
          return j;
        }));
      }, (index + 1) * 3000 + Math.random() * 2000);
    });
  };

  const getJobById = (id: string) => {
    return jobs.find(job => job.id === id);
  };

  return (
    <JobsContext.Provider value={{ jobs, addJobs, getJobById, refreshJobs }}>
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within JobsProvider');
  }
  return context;
};

// Helper functions
function generateMockHash(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'exe': 'PE32 Executable',
    'dll': 'PE32 DLL',
    'elf': 'ELF Binary',
    'bin': 'Binary',
    'apk': 'Android APK',
    'dex': 'Dalvik Executable',
    'so': 'Shared Library',
    'o': 'Object File'
  };
  return types[ext || ''] || 'Unknown';
}

function generateMockThreats(count: number) {
  const threatNames = ['Trojan.Generic', 'Backdoor.Agent', 'Worm.Win32', 'Ransomware.Crypt', 'Spyware.KeyLog'];
  const types = ['Trojan', 'Backdoor', 'Worm', 'Ransomware', 'Spyware'];
  const severities = ['Critical', 'High', 'Medium'];
  const descriptions = [
    'Malicious payload detected',
    'Remote access capability',
    'Self-replicating code',
    'File encryption behavior',
    'Keylogging activity'
  ];

  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    name: threatNames[i % threatNames.length],
    type: types[i % types.length],
    severity: severities[i % severities.length],
    description: descriptions[i % descriptions.length]
  }));
}
