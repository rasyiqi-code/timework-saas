import { LandingContent } from "@/components/home/LandingContent";
import { getCurrentUser } from "@/actions/auth";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function Home() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const currentUser = await getCurrentUser();

  return <LandingContent dict={dict} currentUser={currentUser} locale={locale} />;
}
