/**
 * Device Metadata Collection System
 * Handles session tracking and device metadata collection for EventPlan
 */

class SessionManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.pageViews = 1;
        this.trackingData = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio
        };
        
        // Track page views
        this.trackPageView();
    }
    
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    trackPageView() {
        this.pageViews++;
    }
    
    getSessionData() {
        return {
            ...this.trackingData,
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews
        };
    }
}

class DeviceMetadataCollector {
    static collectDeviceData() {
        return {
            // Device Information
            deviceType: this.detectDeviceType(),
            os: this.getOperatingSystem(),
            browser: this.getBrowserInfo(),
            
            // Hardware Information
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            memory: navigator.deviceMemory || 'unknown',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            
            // Display Information
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            
            // Performance Metrics
            performance: this.getPerformanceMetrics()
        };
    }
    
    static detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    static getOperatingSystem() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown';
    }
    
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }
    
    static getPerformanceMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            return {
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                connectionTime: timing.connectEnd - timing.connectStart
            };
        }
        return null;
    }
}

// Export for use in other scripts
window.SessionManager = SessionManager;
window.DeviceMetadataCollector = DeviceMetadataCollector;

