<template>
  <div class="uk-text-center">
    <span class="uk-text-lead">달력 종류 선택 </span>
    <br />
    <table class="uk-table uk-margin-remove-top">
      <thead>
        <tr>
          <th class="uk-text-center">
            <input
              type="radio"
              v-model="types"
              class="uk-radio"
              name="Views"
              id="monthView"
              value="month"
            />
            <label class="uk-margin-small-left" for="monthView">한 달</label>
          </th>
          <th class="uk-text-center">
            <input
              type="radio"
              v-model="types"
              class="uk-radio"
              name="Views"
              id="weekView"
              value="week"
            />
            <label class="uk-margin-small-left" for="weekView">3주</label>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <img class="uk-width-4-5" src="month.png" />
          </td>
          <td>
            <img class="uk-width-4-5" src="black.png" />
          </td>
        </tr>
      </tbody>
    </table>

    <button
      class="uk-button uk-button-primary uk-button-small uk-position-medium uk-position-top-right"
      uk-slideshow-item="4"
      >다음</button
    >
  </div>
</template>

<script>
export default {
  name: "start-type",
  data() {
    return {
      types: ""
    };
  },
  computed: {
    settings: {
      get() {
        return this.$store.getters.getAll;
      },
      set(value) {
        this.$store.commit("setAll", value);
      }
    }
  },
  mounted() {
    this.types = this.settings.calendarType;
  },
  watch: {
    types(newval) {
      this.$store.commit("setOptions", {
        key: "calendarType",
        value: newval
      });
    }
  }
};
</script>

<style></style>
