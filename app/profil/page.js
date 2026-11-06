import ProfilePage from "../_components/ProfilePage";
import RegisterServiceWorker from "../_components/RegisterServiceWorker";

export const metadata = {
  title: "Profil | Pelari Kalcer",
  description: "Statistik seumur hidup, rekor, tipe lari, dan lencana kamu.",
};

export default function Profil() {
  return (
    <>
      <ProfilePage />
      <RegisterServiceWorker />
    </>
  );
}
