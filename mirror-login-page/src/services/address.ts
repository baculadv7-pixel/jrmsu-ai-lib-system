// Address Management Service
// Handles current and permanent address logic for registration and profile

export interface AddressFields {
  street?: string;
  barangay: string;
  municipality: string;
  province: string;
  region: string;
  country: string;
  zipCode: string;
  landmark?: string;
}

export interface AddressData {
  currentAddress: AddressFields;
  permanentAddress: AddressFields;
  sameAsCurrent: boolean;
  permanentAddressNotes?: string;
}

export class AddressService {
  /**
   * Formats an address object into a readable string
   */
  static formatAddress(address: AddressFields): string {
    const parts = [
      address.street,
      address.barangay,
      address.municipality,
      address.province,
      address.region,
      address.country,
      address.zipCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Validates required address fields
   */
  static validateAddress(address: AddressFields): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = ['barangay', 'municipality', 'province', 'region', 'country', 'zipCode'];
    
    for (const field of requiredFields) {
      const value = address[field as keyof AddressFields];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(`${field} is required`);
      }
    }

    // Validate zip code format (4 digits for Philippines)
    if (address.zipCode && !/^\d{4}$/.test(address.zipCode)) {
      errors.push('Zip code must be 4 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Copies current address to permanent address
   */
  static copyCurrentToPermanent(addressData: AddressData): AddressData {
    return {
      ...addressData,
      permanentAddress: { ...addressData.currentAddress },
      sameAsCurrent: true
    };
  }

  /**
   * Clears permanent address when user unchecks "Same as Current"
   */
  static clearPermanentAddress(addressData: AddressData): AddressData {
    return {
      ...addressData,
      permanentAddress: {
        street: '',
        barangay: '',
        municipality: '',
        province: '',
        region: '',
        country: 'Philippines',
        zipCode: '',
        landmark: ''
      },
      sameAsCurrent: false
    };
  }

  /**
   * Builds a complete address data object for registration
   */
  static buildRegistrationAddressData(formData: any): AddressData {
    const currentAddress: AddressFields = {
      street: formData.addressStreet || '',
      barangay: formData.addressBarangay || '',
      municipality: formData.addressMunicipality || '',
      province: formData.addressProvince || '',
      region: formData.addressRegion || '',
      country: formData.addressCountry || 'Philippines',
      zipCode: formData.addressZip || ''
    };

    const permanentAddress: AddressFields = formData.sameAsCurrent ? 
      { ...currentAddress } : {
        street: formData.permanentAddressStreet || '',
        barangay: formData.permanentAddressBarangay || '',
        municipality: formData.permanentAddressMunicipality || '',
        province: formData.permanentAddressProvince || '',
        region: formData.permanentAddressRegion || '',
        country: formData.permanentAddressCountry || 'Philippines',
        zipCode: formData.permanentAddressZip || ''
      };

    return {
      currentAddress,
      permanentAddress,
      sameAsCurrent: formData.sameAsCurrent || false,
      permanentAddressNotes: formData.addressPermanentNotes || ''
    };
  }

  /**
   * Formats address for display in profile or forms
   */
  static getDisplayAddress(addressData: AddressData, type: 'current' | 'permanent'): string {
    const address = type === 'current' ? addressData.currentAddress : addressData.permanentAddress;
    return this.formatAddress(address);
  }

  /**
   * Updates the region/province/municipality cascade
   */
  static updateAddressCascade(
    addressData: AddressData, 
    field: 'region' | 'province' | 'municipality',
    value: string,
    type: 'current' | 'permanent' = 'current'
  ): AddressData {
    const targetAddress = type === 'current' ? 'currentAddress' : 'permanentAddress';
    const updatedData = { ...addressData };
    
    if (field === 'region') {
      updatedData[targetAddress] = {
        ...updatedData[targetAddress],
        region: value,
        province: '',
        municipality: '',
        zipCode: ''
      };
    } else if (field === 'province') {
      updatedData[targetAddress] = {
        ...updatedData[targetAddress],
        province: value,
        municipality: '',
        zipCode: ''
      };
    } else if (field === 'municipality') {
      updatedData[targetAddress] = {
        ...updatedData[targetAddress],
        municipality: value
      };
    }

    // If current address changes and sameAsCurrent is true, update permanent as well
    if (type === 'current' && addressData.sameAsCurrent) {
      updatedData.permanentAddress = { ...updatedData.currentAddress };
    }

    return updatedData;
  }
}