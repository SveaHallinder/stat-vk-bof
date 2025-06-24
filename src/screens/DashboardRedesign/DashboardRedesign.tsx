import React from "react";
import { Layout } from "../../components/Layout";
import { MainContent } from "./components/MainContent";

export const DashboardRedesign = (): JSX.Element => {
  return (
    <Layout activeItem="Startsida" title="Dashboard">
      <MainContent />
    </Layout>
  );
};