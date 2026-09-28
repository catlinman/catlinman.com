<script lang="ts">
  import { page } from '$app/state'
  import Content from '$components/Content.svelte'

  const status = $derived(page.status)

  // Copy carried over from the old Sanic error handler
  const message = $derived.by(() => {
    if (status === 403) {
      return {
        cause: 'Access to this page denied!',
        reason: 'You\'re probably missing the correct credentials to access this page. It\'s there but you\'re just not allowed to see it. No peeking please.',
      }
    }

    if (status === 404) {
      return {
        cause: 'The page you are looking for was not found!',
        reason: 'If you are 100% sure that there should be a page here please contact the site administrator about this. Would be a shame if others encountered the same problem!',
      }
    }

    return {
      cause: 'An internal server error occured!',
      reason: 'This is not very good. Let\'s hope the server hasn\'t caught fire because of you accessing this page. You should contact the site administrator as soon as possible about this because in any case it\'s bad and should get fixed!',
    }
  })

  const html = $derived(`
    <div class="message">
      <h1>- ${status} -</h1>
      <h2>${message.cause}</h2>
      <p>${message.reason}</p>
    </div>
  `)
</script>

<svelte:head>
  <title>Catlinman - {status}</title>
</svelte:head>

<Content {html} />
