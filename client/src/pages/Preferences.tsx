import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PreferencesView } from '../components/profile/PreferencesView';

export const Preferences: React.FC = () => {
  return (
    <Layout>
      <PreferencesView />
    </Layout>
  );
};

const PreferencesPage = Preferences;
export default PreferencesPage;
