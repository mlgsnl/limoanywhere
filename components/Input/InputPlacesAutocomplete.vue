<script setup lang='ts'>
import { Loader } from '@googlemaps/js-api-loader'
import { Ref } from 'vue'


const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  value: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  successMessage: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
})


const mapsApiKey = useRuntimeConfig().public.GOOGLE_MAPS_API_KEY
const autocomplete = ref(null) as unknown as Ref<google.maps.places.Autocomplete>
const inputField = ref(null) as unknown as Ref<HTMLInputElement>
const place = ref(null) as unknown as Ref<google.maps.places.PlaceResult>

const loader = new Loader({
  apiKey: mapsApiKey,
  version: 'weekly',
  libraries: ['places'],
})

const initAutocomplete = async () => {
  await loader.load().then(() => {
    autocomplete.value = new google.maps.places.Autocomplete(inputField.value, {
      componentRestrictions: { country: ['us', 'ca'] },
      fields: ['place_id', 'formatted_address', 'name'],
    })
    autocomplete.value.setFields(['place_id'])
    autocomplete.value.addListener('place_changed', getAutocompleteComponents)
  })
}

const getAutocompleteComponents = () => {
  place.value = autocomplete.value.getPlace()
  const { place_id } = place.value
  console.log(place_id)
  emit('change', place.value)
  return place_id
}

const emit = defineEmits(['change'])

onMounted(() => {
  initAutocomplete()
})
const modelValue = ref('')
</script>

<template>
  <label
    :for='name'
    class='items-start iq-field row no-wrap q-field--outlined q-input q-field--float q-field--labeled q-field--dense q-field--error'
  >
    <div class='self-stretch q-field__inner relative-position col'>
      <div class='bg-white q-field__control relative-position row no-wrap'>
        <div class='q-field__control-container col relative-position row no-wrap q-anchor--skip'>
          <input
            class='q-field__native q-placeholder'
            :id='name'
            :name='name'
            type='text'
            :value='modelValue'
            @input='event => modelValue = event.target.value'
            :placeholder='placeholder'
            ref='inputField'
          />
          <div class='absolute q-field__label no-pointer-events ellipsis'>{{ label }}</div>
        </div>
      </div>
    </div>
  </label>
</template>
