import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BrandContextType {
    selectedBrandId: number | null;
    setSelectedBrandId: (brandId: number | null) => void;
    isManagementMode: boolean;
    setIsManagementMode: (isManagementMode: boolean) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [isManagementMode, setIsManagementMode] = useState<boolean>(true);

    return (
        <BrandContext.Provider value={{
            selectedBrandId,
            setSelectedBrandId,
            isManagementMode,
            setIsManagementMode
        }}>
            {children}
        </BrandContext.Provider>
    );
};

export const useBrand = () => {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
};
