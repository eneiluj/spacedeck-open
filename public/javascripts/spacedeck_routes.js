console.debug('KKKKK ')
console.debug(ENV)

/*
  SpacedeckRoutes
  This module contains functions dealing with Routing and View Switching.
*/

var SpacedeckRoutes = {

  internal_route: function(path, on_success) {
    if(!this.router) {
      this.router = new RouteRecognizer();

      this.router.add([
        {
          path: "/spaces/:id",
          handler: function(params, on_success) {
            this.load_space(params.id, on_success);
          }.bind(this)
        }
      ]);
      
      this.router.add([
        {
          path: "/s/:hash",
          handler: function(params, on_success) {
            var parts = params.hash.split("-");
            if (path.length > 0) {
              this.load_space(parts.slice(1).join("-"), on_success, null, parts[0]);
            } else {
              // FIXME error handling
              on_success();
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/confirm/:token",
          handler: function(params) {
            if (!this.logged_in) {
              this.redirect_to("/login");
            } else {
              this.confirm_account(params.token);
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/password-confirm/:token",
          handler: function(params) {

            console.log(params.token);

            if (this.logged_in) {
              this.redirect_to("/spaces");
            } else {
              this.reset_token = params.token;
              this.active_view = "password-confirm";
            }

          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/password-reset",
          handler: function(params, test) {
            if (this.logged_in) {
            } else {
              this.active_view = "password-reset";
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/accept/:membership_id",
          handler: function(params, test) {
            if (this.logged_in) {
              var invitation_token = get_query_param("code");
              accept_invitation(params.membership_id, invitation_token , function(m) {
                window._spacedeck_location_change = true;
                location.href = "/spaces/"+m.space._id;
              }.bind(this), function(xhr) {
                smoke.alert("Error ("+xhr.status+")", function() {
                  this.redirect_to("/spaces");
                }.bind(this));
              }.bind(this));
            } else {
              this.redirect_to("/login");
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/signup",
          handler: function(params) {
            var invitation_token = get_query_param("code");

            if (invitation_token) {
              this.invitation_token = invitation_token;
            }
            
            if (this.logged_in) {
              this.redirect_to("/spaces");
            } else {
              this.active_view = "signup";
            }

          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/login",
          handler: function(params) {
            if (this.logged_in) {
              if(this.invitation_token) {
                accept_invitation(this.accept_invitation, function(m) {
                  window._spacedeck_location_change = true;
                  location.href = "spaces/"+m.space_id;
                }.bind(this), function(xhr) { console.error(xhr); });
              } else {
                this.redirect_to("/spaces");
              }
            } else {
              this.active_view = "login";
              token = get_query_param("code");
              if (token) {
                this.login_with_token(token);
              }
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/logout",
          handler: function(params) {
            if (this.logged_in) {
              this.logout(function(m) {
                this.redirect_to("/login");
              }.bind(this), function(xhr) { console.error(xhr); });
            } else {
              this.redirect_to("/login");
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/spaces",
          handler: function(params) {
            if (!this.logged_in) {
              window._spacedeck_location_change = true;
              location.href = "/login";
            } else {

              if (this.logged_in && this.user.home_folder_id) {
                this.load_space(this.user.home_folder_id);
              } else {
                location.href = "/";
              }

            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/account",
          handler: function(params) {
            if (!this.logged_in) {
              window._spacedeck_location_change = true;
              location.href = "/";
            } else {
              this.active_view = "account";
            }
          }.bind(this)
        }
      ]);


      this.router.add([
        {
          path: "/team",
          handler: function(params) {
            if (!this.logged_in) {
              window._spacedeck_location_change = true;
              location.href = "/";
            } else {
              this.active_view = "team";
              this.load_team();
            }
          }.bind(this)
        }
      ]);

      this.router.add([
        {
          path: "/folders/:id",
          handler: function(params) {
            this.load_space(params.id, null, function(xhr) {
              // on_error

              console.log("couldn't load folder: "+xhr.status);
              this.redirect_to("/spaces", function(){});
            }.bind(this));
          }.bind(this)
        }

      ]);

      this.router.add([
        {
          path: "/",
          handler: function(params) {
            location.href = "/";
          }.bind(this)
        }
      ]);
      
      this.router.add([
        {
          path: "/terms",
          handler: function(params) {
            location.href = "/terms";
          }.bind(this)
        }
      ]);
      
      this.router.add([
        {
          path: "/privacy",
          handler: function(params) {
            location.href = "/privacy";
          }.bind(this)
        }
      ]);
    }

    var foundRoute = this.router.recognize(path);
    if (foundRoute) {
      console.debug('FOUNDDDDDDD ' + path)
      foundRoute[0].handler(foundRoute[0].params, on_success);
    } else {
      console.debug('jirayaaaaaa ' + path)
      location.href = "/not_found";
    }
  },

  route: function() {
      console.debug('aaaaaa')
    window.onpopstate = function (event) {
      event.preventDefault();
      console.debug('111111')
      const path = ENV.endpointPath === '/'
        ? location.pathname
        : location.pathname.replace(ENV.endpointPath, '')
      this.internal_route(path);
    }.bind(this);

    $("body").on("click", "a", function(event) {
      console.debug('222222')
      // #hash
      if (event.currentTarget.hash && event.currentTarget.hash.length>1) return;

      // external link?
      if (event.currentTarget.host != location.host) return;

      // modifier keys?
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;

      // /t/ path
      if (event.currentTarget.pathname.match(/^\/t\//)) return;

      const path = ENV.endpointPath === '/'
        ? event.currentTarget.pathname
        : event.currentTarget.pathname.replace(ENV.endpointPath, '')
      this.internal_route(path);
      history.pushState(null, null, event.currentTarget.pathname);

      event.preventDefault();
    }.bind(this));

    const path = ENV.endpointPath === '/'
      ? location.pathname
      : location.pathname.replace(ENV.endpointPath, '')
    console.debug('mémémémémémé ' + path)
    this.internal_route(path);
  },
  
  open_url: function(url) {
    window.open(url,'_blank');
  },
  
  redirect_to: function(path, on_success) {
    if (on_success) {
      this.internal_route(path, on_success);
      history.pushState(null, null, path);
    } else {
      window._spacedeck_location_change = true;
      location.href = path;
    }
  },

  link_to_parent_folder: function(space_id) {
    return "/folders/"+space_id;
  },

  link_to_space: function(space) {
    return "/"+space.space_type+"s/"+space._id;
  }
}
