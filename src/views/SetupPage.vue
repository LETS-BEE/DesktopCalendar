<template>
  <div>
    <headers />
    <div uk-slideshow="draggable: false">
      <ul class="uk-slideshow-items uk-margin-large-top">
        <li>
          <set-start />
        </li>
        <li>
          <set-auth />
        </li>
        <li>
          <set-design />
        </li>
        <li>
          <set-type />
        </li>
        <li>
          <set-option />
        </li>
        <li>
          <set-end />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import headers from '../components/Setup/Header.vue'
import start from '../components/Setup/start.vue'
import auth from '../components/Setup/auth.vue'
import design from '../components/Setup/design.vue'
import types from '../components/Setup/type.vue'
import option from '../components/Setup/option.vue'
import end from '../components/Setup/end.vue'

export default {
  components: {
    'headers': headers,
    'set-start': start,
    'set-auth': auth,
    'set-design': design,
    'set-type': types,
    'set-option': option,
    'set-end': end
  }
}
</script>

<style></style>
