// components/shunt/FlowDiagram.tsx
// FLOW VISUALIZATION: Draw.io-style diagram component for visualizing flows

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getFlowTrackingService, FlowDiagramData } from '../../services/flowTracking.service';
import { MinimizeIcon, MaximizeIcon, TrashIcon, DownloadIcon } from '../icons';
import { audioService } from '../../services/audioService';

// Custom node component for better Draw.io-style appearance
const CustomNode: React.FC<any> = ({ data }) => {
  const getNodeColor = (eventType: string) => {
    switch (eventType) {
      case 'user_input':
        return 'bg-blue-500/20 border-blue-400';
      case 'shunt_action':
      case 'tool_action':
        return 'bg-fuchsia-500/20 border-fuchsia-400';
      case 'tool_execution':
        return 'bg-purple-500/20 border-purple-400';
      case 'ai_output':
      case 'tool_result':
        return 'bg-green-500/20 border-green-400';
      default:
        return 'bg-gray-500/20 border-gray-400';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg ${getNodeColor(data.eventType)} min-w-[200px] max-w-[300px]`}
      title={`${data.eventType} at ${new Date(data.timestamp).toLocaleTimeString()}`}
    >
      <div className="text-sm font-semibold text-white break-words">
        {data.label}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  input: CustomNode,
  default: CustomNode,
  output: CustomNode,
};

interface FlowDiagramProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({ isMinimized, onToggleMinimize }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowService] = useState(() => getFlowTrackingService());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load and refresh flow data
  const loadFlowData = useCallback(() => {
    const currentFlows = flowService.getCurrentFlows();
    if (currentFlows) {
      setNodes(currentFlows.nodes);
      setEdges(currentFlows.edges);
    }
  }, [flowService, setNodes, setEdges]);

  // Auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (autoRefresh) {
      loadFlowData();
      const interval = setInterval(loadFlowData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadFlowData]);

  // Initial load
  useEffect(() => {
    loadFlowData();
  }, [loadFlowData]);

  const handleClearFlows = () => {
    flowService.clearCurrentSession();
    setNodes([]);
    setEdges([]);
    audioService.playSound('click');
  };

  const handleExportFlows = () => {
    const currentFlows = flowService.getCurrentFlows();
    if (!currentFlows || currentFlows.nodes.length === 0) {
      return;
    }

    const dataStr = JSON.stringify(currentFlows, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-diagram-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    audioService.playSound('success');
  };

  if (isMinimized) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-2xl">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-300">Flow Diagram</h3>
            <span className="text-xs text-gray-500">
              ({nodes.length} nodes)
            </span>
          </div>
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 transition-all"
            title="Expand Flow Diagram"
          >
            <MaximizeIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-200">Flow Diagram</h3>
          <span className="text-sm text-gray-500">
            ({nodes.length} nodes, {edges.length} edges)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
              autoRefresh
                ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                : 'bg-gray-700/50 border-gray-600 text-gray-400'
            }`}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Paused'}
          </button>
          <button
            onClick={handleExportFlows}
            disabled={nodes.length === 0}
            className="p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export Flow Diagram"
          >
            <DownloadIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={handleClearFlows}
            className="p-2 rounded-md bg-gray-700/50 hover:bg-red-700/50 border border-gray-600/50 transition-all"
            title="Clear Flow Diagram"
          >
            <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 transition-all"
            title="Minimize Flow Diagram"
          >
            <MinimizeIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="flex-grow relative">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 p-8">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-sm font-medium">No flows yet</p>
              <p className="text-xs mt-2">
                Use a Shunt button or call a tool to see flows appear here
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
              labelStyle: { fill: '#d1d5db', fontSize: 12 },
              labelBgStyle: { fill: '#1f2937', fillOpacity: 0.8 },
              labelBgPadding: [8, 4] as [number, number],
              labelBgBorderRadius: 4,
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#4b5563"
            />
            <Controls
              className="bg-gray-800 border border-gray-700 rounded-lg"
              style={{
                button: {
                  backgroundColor: '#374151',
                  color: '#d1d5db',
                  borderBottom: '1px solid #4b5563',
                },
              }}
            />
            <MiniMap
              nodeColor={(node) => {
                switch (node.data.eventType) {
                  case 'user_input':
                    return '#3b82f6';
                  case 'shunt_action':
                  case 'tool_action':
                    return '#d946ef';
                  case 'tool_execution':
                    return '#a855f7';
                  case 'ai_output':
                  case 'tool_result':
                    return '#22c55e';
                  default:
                    return '#6b7280';
                }
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg"
              maskColor="rgb(17, 24, 39, 0.8)"
            />
            <Panel position="top-left" className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-400" />
                  <span>User Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-fuchsia-500/40 border border-fuchsia-400" />
                  <span>Shunt Action</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500/40 border border-purple-400" />
                  <span>Tool Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500/40 border border-green-400" />
                  <span>AI Output / Result</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

export default FlowDiagram;
