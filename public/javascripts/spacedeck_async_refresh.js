
SpacedeckAsyncRefresh = {
  data: {
    async_timeout: 33,
    lastUpdateTimestamp: null,
  },
  methods: {
    start_loop: function(space) {
      const path = '/spaces/' + space._id + '/actions'
      load_resource('get', path, null, (res, req) => {
        this.lastUpdateTimestamp = res.now
        this.loop(space)
      }, (error) => {
        console.error('Async refresh ERROR')
        console.error(error)
      })
    },

    loop: function(space) {
      console.debug('START LOOP BABY ')
      // console.debug(this)
      // console.debug(this.handle_live_updates)
      // function load_resource(method, path, data, on_success, on_error, on_progress) {
      const path = '/spaces/' + space._id + '/actions/' + this.lastUpdateTimestamp
      load_resource('get', path, null, (res, req) => {
        console.debug('RESULT')
        console.debug(res)
        if (res.actions && res.actions.length > 0) {
          res.actions.forEach((action) => {
            console.debug('OOOOOOOOOOOOOOOOOO ' + action.action)
            this.handle_live_updates(action)
          })
          this.lastUpdateTimestamp = new Date(res.actions[res.actions.length - 1].object.updated_at).getTime()
          console.debug('NEW last TS : ' + this.lastUpdateTimestamp)
        }
        this.loop(space)
      }, (error) => {
        console.error('Async refresh ERROR')
        console.error(error)
      })
    },

  }
}
