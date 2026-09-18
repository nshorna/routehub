'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';

interface SellerAccount {
  id: string;
  role: string;
  seller: {
    id: string;
    businessName: string;
    contactName: string;
    status: string;
    businessEmail?: string | null;
    phone?: string | null;
    pickupAddress?: string;
  };
}

interface SellerAccountContextType {
  sellerAccounts: SellerAccount[];
  selectedSellerAccount: SellerAccount | null;
  loading: boolean;
  setSelectedSellerAccount: (account: SellerAccount | null) => void;
  refreshSellerAccounts: () => Promise<void>;
}

const SellerAccountContext = createContext<SellerAccountContextType | undefined>(undefined);

const SELECTED_SELLER_ACCOUNT_KEY = 'selectedSellerAccountId';

export function SellerAccountProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [sellerAccounts, setSellerAccounts] = useState<SellerAccount[]>([]);
  const [selectedSellerAccount, setSelectedSellerAccountState] = useState<SellerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSellerAccounts = async () => {
    if (!user) {
      setSellerAccounts([]);
      setSelectedSellerAccountState(null);
      setLoading(false);
      return;
    }

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setSellerAccounts([]);
        setSelectedSellerAccountState(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/seller-accounts', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const accounts: SellerAccount[] = data.sellerAccounts || [];
        setSellerAccounts(accounts);

        // Try to restore selected account from localStorage
        const savedAccountId = localStorage.getItem(SELECTED_SELLER_ACCOUNT_KEY);
        if (savedAccountId && accounts.length > 0) {
          const savedAccount = accounts.find(acc => acc.seller.id === savedAccountId);
          if (savedAccount) {
            setSelectedSellerAccountState(savedAccount);
            setLoading(false);
            return;
          }
        }

        // If no saved account or saved account not found, select first account if only one
        if (accounts.length === 1) {
          setSelectedSellerAccountState(accounts[0]);
          localStorage.setItem(SELECTED_SELLER_ACCOUNT_KEY, accounts[0].seller.id);
        } else {
          setSelectedSellerAccountState(null);
        }
      } else {
        setSellerAccounts([]);
        setSelectedSellerAccountState(null);
      }
    } catch (error) {
      console.error('Error fetching seller accounts:', error);
      setSellerAccounts([]);
      setSelectedSellerAccountState(null);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedSellerAccount = (account: SellerAccount | null) => {
    setSelectedSellerAccountState(account);
    if (account) {
      localStorage.setItem(SELECTED_SELLER_ACCOUNT_KEY, account.seller.id);
    } else {
      localStorage.removeItem(SELECTED_SELLER_ACCOUNT_KEY);
    }
  };

  useEffect(() => {
    refreshSellerAccounts();
  }, [user]);

  return (
    <SellerAccountContext.Provider
      value={{
        sellerAccounts,
        selectedSellerAccount,
        loading,
        setSelectedSellerAccount,
        refreshSellerAccounts,
      }}
    >
      {children}
    </SellerAccountContext.Provider>
  );
}

export function useSellerAccount() {
  const context = useContext(SellerAccountContext);
  if (context === undefined) {
    throw new Error('useSellerAccount must be used within a SellerAccountProvider');
  }
  return context;
}
