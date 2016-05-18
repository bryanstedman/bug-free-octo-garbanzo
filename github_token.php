<div class="wrap">
  <h2>Github Token</h2>
  <p>
    A valid Github API token is required for this theme to be able to see updates.
  </p>

  <form method="post" action="options.php">
    <?php settings_fields( 'lre_theme_options' ); ?>
    <?php do_settings_sections( 'lre_theme_options' ); ?>
    <table class="form-table">

        <tr valign="top">
          <th scope="row"><label for="lre_gh_token">Account Token</label></th>
          <td><input type="password" name="lre_gh_token" value="<?php echo esc_attr( get_option('lre_gh_token') ); ?>" /></td>
        </tr>

    </table>

    <?php submit_button(); ?>

  </form>
</div>
