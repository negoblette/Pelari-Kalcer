import { FeedPage } from "../_components/Pages";
import RegisterServiceWorker from "../_components/RegisterServiceWorker";

export const metadata = {
  title: "Feed | Pelari Kalcer",
  description: "Lari kamu dan teman.",
};

export default function Feed() {
  return (
    <>
      <FeedPage />
      <RegisterServiceWorker />
    </>
  );
}
