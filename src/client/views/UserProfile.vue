<!-- UserProfile.vue (Parent/Router Component) -->
<template>
  <div>
    <ProfileView
        v-if="$route.params.id"
        :userId="$route.params.id"
    />
    <ProfileEdit v-else />
  </div>
</template>

<script>
import ProfileView from './ProfileView.vue'
import ProfileEdit from './ProfileEdit.vue'

export default {
  name: 'UserProfile',
  components: {
    ProfileView,
    ProfileEdit
  }
}
</script>