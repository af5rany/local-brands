export enum AddressType {
    SHIPPING = 'shipping',
    BILLING = 'billing',
    BOTH = 'both',
}

export interface Address {
    id: number;
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
    type: AddressType;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}
