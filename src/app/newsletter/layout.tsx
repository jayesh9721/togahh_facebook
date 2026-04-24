import DashboardLayout from "@/components/layout/DashboardLayout";
import { ServicesProvider } from "@/context/ServicesContext";
import { CampaignProvider } from "@/context/CampaignContext";
import { NewsletterHistoryProvider } from "@/context/NewsletterHistoryContext";
import { NewsletterProvider } from "@/context/NewsletterContext";

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServicesProvider>
      <CampaignProvider>
        <NewsletterHistoryProvider>
          <NewsletterProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </NewsletterProvider>
        </NewsletterHistoryProvider>
      </CampaignProvider>
    </ServicesProvider>
  );
}
