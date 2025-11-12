// components/tool_for_ai/ToolforAI.tsx
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import TabFooter from '../common/TabFooter';
import { Job } from '../../types';
import { useJobManager } from '../../hooks/useJobManager';
import JobList from './JobList';
import JobDetails from './JobDetails';
import { DeveloperIcon, BoltIcon } from '../icons';
import Loader from '../Loader';

const ToolforAI: React.FC = () => {
    const { updateTelemetryContext } = useTelemetry();
    const [prompt, setPrompt] = useState('Refactor the auth.js file to use modern async/await syntax instead of callbacks.');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    
    const { jobs, submitJob, cancelJob, isRunning } = useJobManager();

    useEffect(() => {
        updateTelemetryContext({ tab: 'tool_for_ai' });
    }, [updateTelemetryContext]);
    
    // Keep selected job details up to date
    useEffect(() => {
        if (selectedJob) {
            const updatedJob = jobs.find(j => j.id === selectedJob.id);
            if (updatedJob) {
                setSelectedJob(updatedJob);
            } else {
                setSelectedJob(null); // Job was removed/cleared
            }
        }
    }, [jobs, selectedJob]);

    const handleRun = () => {
        if (prompt.trim()) {
            submitJob(prompt.trim());
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/20">
            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Column: Controls and Job List */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 shadow-lg flex-shrink-0">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
                            <DeveloperIcon className="w-7 h-7 text-fuchsia-400" />
                            AI Job Runner
                        </h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a task for the AI agent..."
                            className="w-full bg-gray-900/50 rounded-md border border-gray-700 p-3 text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            rows={4}
                            disabled={isRunning}
                        />
                        <button
                            onClick={handleRun}
                            disabled={isRunning || !prompt.trim()}
                            className="w-full mt-4 px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isRunning ? <Loader /> : <BoltIcon className="w-5 h-5" />}
                            {isRunning ? 'Processing...' : 'Submit Job'}
                        </button>
                    </div>
                    <JobList 
                        jobs={jobs}
                        onSelect={setSelectedJob}
                        onCancel={cancelJob}
                        selectedJobId={selectedJob?.id || null}
                    />
                </div>

                {/* Right Column: Job Details */}
                <div className="overflow-hidden">
                     <JobDetails job={selectedJob} />
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default ToolforAI;