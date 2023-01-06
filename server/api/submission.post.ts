import { ValidationSchema, formSchema } from '~/schema/quoteFormValues'
import { TripData, PlaceDataOrigin, PlaceDataDestination } from '~/types/data'
import { rates } from '~/data/rates'
import { Rates, Surcharges } from '~/types/Rates'
import { surcharges } from '~/data/rates'
import {
  getRateFromId,
  getBaseRate,
  getSurchargeAmounts,
} from '~/composables/useRateCalculator'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)
  try {
    const body = await readBody(event)
    console.log('This is the returned body', body)

    const {
      calculatedDistance,
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      selectedVehicleType,
      isItHourly,
      isRoundTrip,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      placeDataDestination,
      placeDataOrigin,
      selectedServiceType,
      selectedNumberOfHours,
      tripData,
      selectedPassengers,
    } = body.data as ValidationSchema

    const {
      distanceText,
      distanceValue,
      durationText,
      durationValue,
      endLat,
      endLng,
      startLat,
      startLng,
    } = tripData as TripData

    const isPearson = (origin: string) => {
      if (origin === 'Toronto Pearson International Airport') {
        return true
      }
    }

    const {
      formatted_address: originFormattedAddress,
      name: originName,
      place_id: originPlaceId,
    } = placeDataOrigin as PlaceDataOrigin

    const isPearsonAirportPickup = isPearson(originName)

    const {
      formatted_address: destinationFormattedAddress,
      name: destinationName,
      place_id: destinationPlaceId,
    } = placeDataDestination as PlaceDataDestination

    const isPearsonAirportDropoff = isPearson(destinationName)

    const { value: hoursValue, label: hoursLabel } = selectedNumberOfHours || {
      value: 0,
      label: '0 hrs',
    }

    const { value: passengersValue, label: passengersLabel } =
      selectedPassengers || { value: 0, label: '1 Passenger' }

    const { value: vehicleTypeValue, label: vehicleTypeLabel } =
      selectedVehicleType || { value: 0, label: 'Standard Sedan' }

    const { value: serviceTypeValue, label: serviceTypeLabel } =
      selectedServiceType || { value: 0, label: 'Point To Point' }

    const { value: selectedHours, label: selectedHoursLabel } =
      selectedNumberOfHours || { value: 0, label: 'Hours Not Selected' }

    const rate = getRateFromId(serviceTypeValue, rates)

    const baseRate = getBaseRate(
      isItHourly,
      selectedHours,
      calculatedDistance,
      rate as Rates
    )

    const computedSurcharges = getSurchargeAmounts(
      baseRate,
      surcharges as unknown as Surcharges
    )
    const { fuelSurcharge, gratuity, HST } = computedSurcharges

    const calculatedTotal = () => {
      if (isPearsonAirportPickup) {
        return baseRate + fuelSurcharge + gratuity + HST + 15
      }
      if (!isPearsonAirportPickup) {
        return baseRate + fuelSurcharge + gratuity + HST
      }
      if (isPearsonAirportPickup || (isPearsonAirportDropoff && isRoundTrip)) {
        return (baseRate + fuelSurcharge + gratuity + HST) * 2 + 15
      }
      if (!isPearsonAirportDropoff && !isPearsonAirportPickup && isRoundTrip) {
        return (baseRate + fuelSurcharge + gratuity + HST) * 2
      }
    }

    const addUser = async () => {
      const { data, error } = await supabase
        .from('user')
        .upsert({
          // @ts-ignore
          firstName,
          lastName,
          emailAddress,
          phoneNumber,
        })
        .select()
      console.log('This is the returned data', data)
      console.log('This is the returned error', error)
    }

    const addQuote = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .upsert({
          // @ts-ignore
          pickupDate: pickupDate,
          pickupTime: pickupTime,
          isRoundTrip: isRoundTrip,
          returnDate: returnDate,
          returnTime: returnTime,
          originFormattedAddress: placeDataOrigin.formatted_address,
          originName: placeDataOrigin.name,
          originPlaceId: placeDataOrigin.place_id,
          startLat: tripData.startLat,
          startLng: tripData.startLng,
          destinationFormattedAddress: placeDataDestination.formatted_address,
          destinationName: placeDataDestination.name,
          destinationPlaceId: placeDataDestination.place_id,
          endLat: tripData.endLat,
          endLng: tripData.endLng,
          vehicleTypeLabel: selectedVehicleType.label,
          vehicleTypeValue: selectedVehicleType.value,
          serviceTypeLabel: selectedServiceType.label,
          serviceTypeValue: selectedServiceType.value,
          passengersLabel: selectedPassengers.label,
          passengersValue: selectedPassengers.value,
          isItHourly: isItHourly,
          // @ts-ignore
          hoursLabel: selectedNumberOfHours.label,
          // @ts-ignore
          hoursValue: selectedNumberOfHours.value,
          distanceText: tripData.distanceText,
          distanceValue: tripData.distanceValue,
          durationText: tripData.durationText,
          durationValue: tripData.durationValue,
          calculatedDistance: calculatedDistance,
          baseRate,
          fuelSurcharge,
          gratuity,
          HST,
          userEmail: emailAddress,
          totalFare: calculatedTotal(),
          firstName,
          lastName,
        })
        .select()
      console.log('This is the returned quote data', data)
      console.log('This is the returned quote error', error)
    }
    await addUser()
    await addQuote()

    return {
      rate,
      statusCode: 200,
      body,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      originName,
      originFormattedAddress,
      originPlaceId,
      startLat,
      startLng,
      destinationName,
      destinationFormattedAddress,
      destinationPlaceId,
      endLat,
      endLng,
      serviceTypeLabel,
      serviceTypeValue,
      vehicleTypeLabel,
      vehicleTypeValue,
      passengersLabel,
      passengersValue,
      isItHourly,
      hoursValue,
      hoursLabel,
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      isRoundTrip,
      distanceValue,
      distanceText,
      durationText,
      durationValue,
      calculatedDistance,
      baseRate,
      fuelSurcharge,
      gratuity,
      HST,
      totalFare: calculatedTotal(),
    }
  } catch (error) {
    console.log(error)
  }
})
