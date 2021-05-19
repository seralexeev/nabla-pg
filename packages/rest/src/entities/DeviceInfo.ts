export type WebDeviceInfo = {
    type: 'web';
    deviceId: string;
    os?: string;
    browser?: string;
};

export type MobileDeviceInfo = {
    type: 'mobile';
    deviceId: string;
    os: string;
    osVersion?: string;
    model?: string;

    manufacturer?: string;
    appName?: string;
    brand?: string;
    buildNumber?: string;
    bundleId?: string;
    deviceType?: string;
    seadableVersion?: string;
    version?: string;
    deviceName?: string;
    carrier?: string;
    ipAddress?: string;
    isEmulator?: boolean;
};

export type DeviceInfo = MobileDeviceInfo | WebDeviceInfo;
