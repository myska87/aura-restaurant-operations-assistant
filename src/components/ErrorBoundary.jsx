import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
      user: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
    
    this.setState({ 
      error, 
      errorInfo 
    });

    try {
      // Get current user (may fail if auth is broken)
      const user = await base44.auth.me().catch(() => null);
      this.setState({ user });

      // Log error to database (fail silently if logging breaks)
      await base44.entities.AppErrorLog.create({
        user_email: user?.email || 'anonymous',
        page_name: this.props.currentPageName || 'unknown',
        error_message: error.toString(),
        error_stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    } catch (loggingError) {
      console.error('Error boundary logging failed:', loggingError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isAdmin = this.state.user?.role === 'admin' || this.state.user?.role === 'owner';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-2 border-red-300 shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16" />
              </div>
              <CardTitle className="text-3xl font-bold">Something went wrong</CardTitle>
              <p className="text-red-100 mt-2">
                We're sorry, but something unexpected happened. Please try reloading the page.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-slate-300 font-semibold px-6"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Technical Details (Admin Only) */}
              {isAdmin && this.state.error && (
                <div className="mt-6">
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center justify-between w-full p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <span className="font-semibold text-slate-700">Technical Details (Admin)</span>
                    {this.state.showDetails ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  
                  {this.state.showDetails && (
                    <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-auto max-h-64 text-sm font-mono">
                      <div className="mb-3">
                        <strong className="text-red-400">Error:</strong>
                        <p className="mt-1">{this.state.error.toString()}</p>
                      </div>
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-red-400">Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* User Message */}
              <div className="text-center text-sm text-slate-500 mt-6">
                {this.state.user ? (
                  <p>Error has been logged. Support team has been notified.</p>
                ) : (
                  <p>If this issue persists, please contact support.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;