import * as amplitude from '@amplitude/unified';

amplitude.initAll(
  'c6620f422c9bc730e0be8a114f4c7d1d',
  {
    analytics: {
      autocapture: {
        attribution: {
          trackingMethod: [
            'userProperty',
            'eventProperty'
          ]
        },
        fileDownloads: true,
        formInteractions: true,
        pageViews: true,
        sessions: true,
        elementInteractions: true,
        networkTracking: true,
        webVitals: true,
        frustrationInteractions: {
          thrashedCursor: true,
          errorClicks: true,
          deadClicks: true,
          rageClicks: true
        }
      }
    },
    sessionReplay: {
      sampleRate: 1
    }
  }
);