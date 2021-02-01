
SpacedeckAsyncRefresh = {
  data: {
    async_timeout: 33,
    lastUpdateTimestamp: null,
    clientSessionId: null,
  },
  methods: {
    genSessionId: function() {
      let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let str = ''
      for (let i = 0; i < 32; i++) {
          str += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return str
    },
    start_loop: function(space_id) {
      if (this.lastUpdateTimestamp !== null) {
        this.loop(space_id)
      } else {
        this.clientSessionId = this.genSessionId()
        const path = '/spaces/' + space_id + '/actions'
        load_resource('get', path, null, (res, req) => {
          this.lastUpdateTimestamp = res.now
          this.loop(space_id)
        }, (error) => {
          console.error('Async refresh ERROR')
          console.error(error)
          setTimeout(() => {
            this.start_loop(space_id)
          }, 5000)
        })
      }
    },

    loop: function(space_id) {
      console.debug('START LOOP BABY ')
      const path = '/spaces/' + space_id + '/actions/' + this.clientSessionId + '/' + this.lastUpdateTimestamp
      load_resource('get', path, null, (res, req) => {
        if (res.actions && res.actions.length > 0) {
          console.debug('Applying ' + res.actions.length + ' updates')
          console.debug(res.actions)
          res.actions.forEach((action) => {
            if (['delete', 'create', 'update', 'update-self'].includes(action.action)) {
              this.handle_live_updates(action)
            } else if (action.action === 'cursor') {
              this.handle_user_cursor_update(action.object);
            } else if (action.action === 'media') {
              this.handle_presenter_media_update(action.object);
            } else if (action.action === 'viewport') {
              this.handle_presenter_viewport_update(action.object);
            }
          })
          this.lastUpdateTimestamp = new Date(res.actions[res.actions.length - 1].object.updated_at).getTime()
        }
        this.loop(space_id)
      }, (error) => {
        console.error('Async refresh ERROR')
        console.error(error)
        setTimeout(() => {
          this.loop(space_id)
        }, 5000)
      })
    },

  }
}
