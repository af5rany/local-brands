import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

@Injectable()
export class CarrierTrackingService {
  private readonly logger = new Logger(CarrierTrackingService.name);

  constructor(private configService: ConfigService) {}

  async getTrackingStatus(
    carrier: string,
    trackingNumber: string,
  ): Promise<TrackingResult> {
    if (!trackingNumber) {
      return { carrier, trackingNumber: '', status: 'No tracking number provided', events: [] };
    }

    try {
      switch (carrier?.toUpperCase()) {
        case 'FEDEX':
          return await this.fetchFedEx(trackingNumber);
        case 'UPS':
          return await this.fetchUPS(trackingNumber);
        case 'USPS':
          return await this.fetchUSPS(trackingNumber);
        case 'DHL':
          return await this.fetchDHL(trackingNumber);
        default:
          return {
            carrier: carrier || 'OTHER',
            trackingNumber,
            status: 'Manual tracking — visit carrier website',
            events: [],
          };
      }
    } catch (err) {
      this.logger.warn(`Carrier tracking failed for ${carrier}/${trackingNumber}: ${err.message}`);
      return {
        carrier,
        trackingNumber,
        status: 'Tracking unavailable',
        events: [],
      };
    }
  }

  private async fetchFedEx(trackingNumber: string): Promise<TrackingResult> {
    const clientId = this.configService.get<string>('FEDEX_API_KEY');
    const clientSecret = this.configService.get<string>('FEDEX_SECRET');

    if (!clientId || !clientSecret) {
      return this.unsupportedResult('FEDEX', trackingNumber, 'FedEx credentials not configured');
    }

    // FedEx OAuth token
    const tokenRes = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!tokenRes.ok) return this.unsupportedResult('FEDEX', trackingNumber, 'Auth failed');
    const { access_token } = await tokenRes.json();

    const trackRes = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-locale': 'en_US',
      },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      }),
    });
    if (!trackRes.ok) return this.unsupportedResult('FEDEX', trackingNumber, 'Track request failed');
    const data = await trackRes.json();

    const result = data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
    const status = result?.latestStatusDetail?.description || 'Unknown';
    const estimated = result?.estimatedDeliveryTimeWindow?.window?.ends;
    const scans: TrackingEvent[] = (result?.dateAndTimes || [])
      .filter((d: any) => d.type === 'ACTUAL_DELIVERY' || d.type === 'SHIP')
      .map((d: any) => ({
        timestamp: d.dateTime,
        location: '',
        description: d.type.replace(/_/g, ' '),
      }));

    return { carrier: 'FEDEX', trackingNumber, status, estimatedDelivery: estimated, events: scans };
  }

  private async fetchUPS(trackingNumber: string): Promise<TrackingResult> {
    const clientId = this.configService.get<string>('UPS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('UPS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return this.unsupportedResult('UPS', trackingNumber, 'UPS credentials not configured');
    }

    // UPS OAuth token
    const tokenRes = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!tokenRes.ok) return this.unsupportedResult('UPS', trackingNumber, 'Auth failed');
    const { access_token } = await tokenRes.json();

    const trackRes = await fetch(
      `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}?locale=en_US&returnSignature=false`,
      { headers: { Authorization: `Bearer ${access_token}`, transId: 'localbrands', transactionSrc: 'testing' } },
    );
    if (!trackRes.ok) return this.unsupportedResult('UPS', trackingNumber, 'Track request failed');
    const data = await trackRes.json();

    const shipment = data?.trackResponse?.shipment?.[0];
    const pkg = shipment?.package?.[0];
    const status = pkg?.currentStatus?.description || 'Unknown';
    const events: TrackingEvent[] = (pkg?.activity || []).map((a: any) => ({
      timestamp: `${a.date} ${a.time}`,
      location: [a.location?.address?.city, a.location?.address?.stateProvince, a.location?.address?.countryCode]
        .filter(Boolean).join(', '),
      description: a.status?.description || '',
    }));

    return { carrier: 'UPS', trackingNumber, status, events };
  }

  private async fetchUSPS(trackingNumber: string): Promise<TrackingResult> {
    const userId = this.configService.get<string>('USPS_USER_ID');
    if (!userId) return this.unsupportedResult('USPS', trackingNumber, 'USPS credentials not configured');

    const xml = `<TrackFieldRequest USERID="${userId}"><TrackID ID="${trackingNumber}"></TrackID></TrackFieldRequest>`;
    const res = await fetch(
      `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xml)}`,
    );
    if (!res.ok) return this.unsupportedResult('USPS', trackingNumber, 'USPS request failed');
    const text = await res.text();

    // Parse minimal XML (avoid xml parser dependency)
    const statusMatch = text.match(/<TrackSummary>(.*?)<\/TrackSummary>/);
    const status = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '') : 'Unknown';

    const eventMatches = [...text.matchAll(/<TrackDetail>(.*?)<\/TrackDetail>/g)];
    const events: TrackingEvent[] = eventMatches.map((m) => ({
      timestamp: '',
      location: '',
      description: m[1].replace(/<[^>]+>/g, ''),
    }));

    return { carrier: 'USPS', trackingNumber, status, events };
  }

  private async fetchDHL(trackingNumber: string): Promise<TrackingResult> {
    const apiKey = this.configService.get<string>('DHL_API_KEY');
    if (!apiKey) return this.unsupportedResult('DHL', trackingNumber, 'DHL credentials not configured');

    const res = await fetch(
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
      { headers: { 'DHL-API-Key': apiKey } },
    );
    if (!res.ok) return this.unsupportedResult('DHL', trackingNumber, 'DHL request failed');
    const data = await res.json();

    const shipment = data?.shipments?.[0];
    const status = shipment?.status?.description || 'Unknown';
    const estimated = shipment?.estimatedTimeOfDelivery;
    const events: TrackingEvent[] = (shipment?.events || []).map((e: any) => ({
      timestamp: e.timestamp,
      location: [e.location?.address?.addressLocality, e.location?.address?.countryCode]
        .filter(Boolean).join(', '),
      description: e.description,
    }));

    return { carrier: 'DHL', trackingNumber, status, estimatedDelivery: estimated, events };
  }

  private unsupportedResult(carrier: string, trackingNumber: string, reason: string): TrackingResult {
    return { carrier, trackingNumber, status: reason, events: [] };
  }
}
