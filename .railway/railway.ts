import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const api = service("api", {
    source: github({
      repo: "bbeatonportdj/dj-music-marketplace",
      branch: "main",
      rootDirectory: "/server",
    }),
    build: "npm install && npm run build",
    start: "npm start",
  });

  return project("dj-marketplace-api", {
    resources: [api],
  });
});
