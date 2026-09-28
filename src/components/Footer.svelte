<script lang="ts">
  import { onMount } from 'svelte'

  // The build fills in the year it ran, the browser brings it up to date
  let year = $state(new Date().getFullYear())

  onMount(() => {
    year = new Date().getFullYear()
  })

  const icons = [
    { name: 'twitter', title: 'Twitter', url: 'https://twitter.com/catllnman' },
    { name: 'facebook', title: 'Facebook', url: 'https://facebook.com/catllnman' },
    { name: 'youtube', title: 'YouTube', url: 'https://youtube.com/catlinman' },
    { name: 'deviantart', title: 'DeviantArt', url: 'https://catlinman.deviantart.com/' },
    { name: 'github', title: 'GitHub', url: 'https://github.com/catlinman' },
    { name: 'steam', title: 'Steam', url: 'https://steamcommunity.com/id/catlinman' },
    { name: 'twitch', title: 'Twitch', url: 'https://twitch.tv/catlinman' },
  ]
</script>

<footer>
  <div class="row">
    <p class="current">
      <span>Now</span> <a href="https://zealsprince.com">zealsprince.com</a>
    </p>

    <div class="end">
      <span class="credit">&copy; Catlinman 2013 - {year}</span>
      <a href="https://github.com/catlinman/catlinman.com">Source</a>

      <div class="icons">
        {#each icons as icon (icon.name)}
          <a class="profile-icon icon-{icon.name}" title={icon.title} href={icon.url}></a>
        {/each}
      </div>
    </div>
  </div>
</footer>

<style lang="scss">
  @use "@/vars.scss" as vars;

  footer {
    position: relative;
    z-index: 2;
    padding: 10px 24px;
    border-top: 1px solid rgba(254, 206, 126, 0.1);
    background: rgba(13, 13, 13, 0.7);
    backdrop-filter: blur(16px);
    font-size: 0.8em;
    text-transform: uppercase;
    color: vars.$secondary-color;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 24px;
    line-height: 26px;
  }

  .current {
    margin: 0;

    span {
      color: vars.$muted-color;
    }
  }

  .end {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icons {
    display: flex;
    gap: 6px;

    a {
      --icon-inset: 2px;
      display: block;
      width: 26px;
      height: 26px;
      border-radius: 100%;
      border: solid 1px transparent;
      transition: all 0.12s ease-in-out;

      &:hover {
        border: solid 1px vars.$base-color;
        box-shadow: 0px 0px 8px vars.$base-color;
      }
    }
  }

  .credit {
    color: vars.$muted-color;
    white-space: nowrap;
  }

  // Phones stack the row: the zealsprince link, then credit and icons
  @media all and (max-width: vars.$content-width-mobile) {
    .row {
      flex-direction: column;
      gap: 10px;
    }

    .end {
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px 16px;
    }
  }
</style>
