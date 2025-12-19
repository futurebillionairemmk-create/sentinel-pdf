
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: "",
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-6 max-w-lg mx-auto mt-20">
                    <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                        <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Isolation Fault Detected</h2>
                    <p className="text-xs text-slate-500 font-mono leading-relaxed italic">
                        "The document structure caused a critical rendering overflow. Secure process has been terminated to prevent potential execution."
                    </p>
                    <div className="bg-slate-900 p-4 rounded-lg font-mono text-[10px] text-red-400 w-full text-left overflow-auto max-h-32 border border-red-900/20">
                        ERR: {this.state.errorMessage}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-lg transition"
                    >
                        <RotateCcw size={14} /> Reset Sentinel Node
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
