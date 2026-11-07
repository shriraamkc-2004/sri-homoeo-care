import { createFileRoute } from "@tanstack/react-router";
import ClinicExperience from "@/components/clinic/clinic-experience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sri Homoeo Care | Cure at the Core" },
      {
        name: "description",
        content:
          "Book an in-clinic homoeopathic consultation, track your appointment, and stay connected with Sri Homoeo Care.",
      },
      { property: "og:title", content: "Sri Homoeo Care | Cure at the Core" },
      {
        property: "og:description",
        content: "Thoughtful homoeopathic care and a simpler way to manage your care visits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClinicExperience />;
}