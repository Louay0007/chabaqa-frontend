import BuildCommunityClient from "../components/build-community-client"
import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"

export const dynamic = 'force-dynamic'

export default async function BuildCommunityPage() {
  // Vérifier si l'utilisateur est authentifié
  const user = await getProfileServer()

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  // avec un paramètre redirect pour revenir à cette page après connexion
  if (!user) {
    redirect("/signin")
  }

  return <BuildCommunityClient />
}
