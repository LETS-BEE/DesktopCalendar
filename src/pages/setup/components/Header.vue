<script setup lang="ts">
// https://velog.io/@dmstmdrbs/VueVite-%EB%B9%8C%EB%93%9C-%EC%8B%9C-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EB%8F%99%EC%A0%81-%EB%A1%9C%EB%94%A9-%EC%97%90%EB%9F%AC
// img src="icon.png" ==> img :src="`icon.png`" 로 변경하여 아이콘을 찾지 못하는 오류 해결
</script>

<template>
    <div uk-sticky>
        <div class="uk-card uk-card-small uk-card-default uk-padding-small start-header" uk-grid>
            <img :src="`icon.png`" alt="Desktop Calendar" id="top-icon"/>
            <div class="uk-card-body">
                <h3 class="uk-card-title">Desktop Calendar</h3>
            </div>
        </div>
    </div>
</template>

<style scoped>
#top-icon {
    width: 100px;
}

</style>