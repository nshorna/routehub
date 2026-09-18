import * as riderModel from "@/lib/models/rider"
import { RiderProfile } from "@/components/rider/profile"

export default async function RiderProfilePage() {
  const riders = await riderModel.getRiders()
  const rider = riders[0]

  if (!rider) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Rider not found</p>
      </div>
    )
  }

  return <RiderProfile rider={rider} updateProfile={updateRiderProfileAction.bind(null, rider.id)} />
}

async function updateRiderProfileAction(riderId: string, formData: FormData) {
  "use server"

  const name = (formData.get("name") as string) || undefined
  const phone = (formData.get("phone") as string) || undefined
  const email = (formData.get("email") as string) || undefined
  const bikeInfo = (formData.get("bikeInfo") as string) || undefined
  const ghanaCardName = (formData.get("ghanaCardName") as string) || undefined
  const ghanaCardNumber = (formData.get("ghanaCardNumber") as string) || undefined
  const dateOfBirth = (formData.get("dateOfBirth") as string) || undefined
  const licenseNumber = (formData.get("licenseNumber") as string) || undefined
  const licenseExpiration = (formData.get("licenseExpiration") as string) || undefined
  const hasSmartphone = formData.get("hasSmartphone") === "on"
  const hasGhanaNumber = formData.get("hasGhanaNumber") === "on"

  await riderModel.updateRiderProfile(riderId, {
    name,
    phone,
    email,
    bikeInfo,
    ghanaCardName,
    ghanaCardNumber,
    dateOfBirth,
    licenseNumber,
    licenseExpiration,
    hasSmartphone,
    hasGhanaNumber,
  })
}
