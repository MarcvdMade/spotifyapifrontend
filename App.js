import React, { Component, useCallback, createElement } from 'react';
import './Apptest.scss';
import logo from './img/spotifylogo.png';
import * as $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faArrowAltCircleLeft, faStepBackward, faStepForward, faRandom, faArrowRight, faArrowLeft, faChevronCircleLeft, faChevronCircleRight, faRetweet } from '@fortawesome/free-solid-svg-icons'
import SpotifyWebApi from 'spotify-web-api-js';

// Creates an instance of the Spotify API.
const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor(props) {
    super(props);
    const params = this.getHashParams();
    const token = params.access_token;

    // Sets the access Token if one exists.
    if (token) {
      spotifyApi.setAccessToken(token);
    }

    //Set the default state
    this.state = {
      loggedIn: token ? true : false,
      playing: false,
      nowPlaying: { name: 'Not Checked', albumArt: '', artist: 'Not Checked', shuffleState: false, repeatState: '', progress_ms: 0, itemDuration: 0 },
      is_playing: false,
      nowLogged: { user: 'Not Checked', profileImg: '', email: '', id: '' },
      playlists: { name: [], id: [], img: [], uri: [], total: 0 },
      offset: 0
    };
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.getNowPlaying = this.getNowPlaying.bind(this);
    this.getPlaylist = this.getPlaylist.bind(this);
    this.startPlaylist = this.startPlaylist.bind(this);
    this.shuffle = this.shuffle.bind(this);
    this.logOut = this.logOut.bind(this);
    this.repeat = this.repeat.bind(this);
  }

  /**
   * Hashes the authorization code and returns it.
   */
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }

  /**
   * Retrieve which song is playing on spotify
   */
  getNowPlaying() {
    spotifyApi.getMyCurrentPlaybackState()
      .then((response) => {
        this.setState({
          playing: true,
          nowPlaying: {
            name: response.item.name,
            albumArt: response.item.album.images[0].url,
            artist: response.item.artists[0].name,
            shuffleState: response.shuffle_state,
            repeatState: response.repeat_state,
            progress_ms: response.progress_ms,
            itemDuration: response.item.duration_ms
          },
          is_playing: response.is_playing,
        });
      })
      .catch((response) => {
        this.setState({
          playing: false,
          nowPlaying: {
            name: "Nothing is playing",
            albumArt: "",
            artist: "Start a playlist on your spotify",
            shuffleState: false,
            repeatState: "",
            Progress_ms: "",
            itemDuration: ""
          }
        })
      })
  }

  /**
   * Function for skipping tracks to next song.
   */
  skipTrack() {
    spotifyApi.skipToNext()
  }

  /**
   * Function for skipping to previous song.
   */
  previousTrack() {
    spotifyApi.skipToPrevious()
  }

  /**
   * Function to pause the current song.
   */
  pause() {
    this.setState({ is_playing: false })
    spotifyApi.pause()
  }

  /**
   * Function to play/resume playing a song on spotify.
   */
  play() {
    this.setState({ is_playing: true })
    spotifyApi.play()
  }

  /**
   * Function for changing the playing order
   */
  shuffle() {
    // Retrieves which state the shuffle button has.
    let shuffleState = this.state.nowPlaying.shuffleState

    // Create if statement for changing shuffle state.
    if (shuffleState) {
      spotifyApi.setShuffle(false)
    } else {
      spotifyApi.setShuffle(true)
    }

  }

  /**
   * Function for changing the repeat state
   * Switch between no repeat, playlist repeat and song repeat
   */
  repeat() {
    // Retrieves which state the repeat button has.
    let repeat = this.state.nowPlaying.repeatState

    // Checks which state the button has client-sided and transfers the answer to the Spotify API.
    if (repeat === 'off') {
      spotifyApi.setRepeat('context')
    } else if (repeat === 'context') {
      spotifyApi.setRepeat('track')
    } else {
      spotifyApi.setRepeat('off')
    }
  }

  /**
   * create start playlist with clicked playlist uri
   * 
   * @param {*} e
   * 
   */
  startPlaylist(e) {
    let target = e.currentTarget.getAttribute("uri")
    spotifyApi.play({ context_uri: target })
  }

  /**
   * Function retrieves the user data.
   */
  getUser() {
    spotifyApi.getMe()
      .then((response) => {
        this.setState({
          nowLogged: {
            user: response.display_name,
            profileImg: response.images[0].url,
            email: response.email,
            id: response.id,
          }
        })
      })
      .catch((response) => {
        this.setState({
          nowLogged: {
            user: "No user found",
            profileImg: "",
          }
        })
      })
  }

  /**
   * Function clears the session and thus logs out the user.
   */
  logOut() {
    this.setState({
      loggedIn: false,
      playing: false,
      nowPlaying: { name: 'Not Checked', albumArt: '', artist: 'Not Checked', shuffleState: false, progress_ms: 0, itemDuration: 0 },
      is_playing: false,
      nowLogged: { user: 'Not Checked', profileImg: '', email: '', id: '' },
      playlists: { name: [], id: [], img: [], uri: [], total: 0 },
    });
  }

  /**
   * Function retrieves all the playlists of the user.
   */
  getPlaylist() {

    let offset = this.state.offset

    spotifyApi.getUserPlaylists({ limit: 50, offset: offset })
      .then((response) => {
        let playlists = response.items

        let names = []
        let ids = []
        let imgs = []
        let uris = []
        for (let i = 0; i < response.items.length; i++) {
          names.push(playlists[i].name)
          ids.push(playlists[i].id)
          imgs.push(playlists[i].images[0].url)
          uris.push(playlists[i].uri)
        }
        this.setState({
          playlists: {
            name: names,
            id: ids,
            img: imgs,
            uri: uris,
            total: response.total
          }
        })
      })
  }

  /**
   * Function to skip to the next set of playlists
   */
  nextPlaylists() {
    //get the offset and total of playlists
    let total = this.state.playlists.total;
    let offset = this.state.offset

    // If the offset is smaller than the total minus 50, set it to 0. (The user will retrieve the first playlists page).
    if (offset > total - 50) {
      this.setState({
        offset: 0
      })
    } else {
      this.setState({
        offset: offset + 50
      })
    }
  }

  /**
   * Function to skip to the previous set of playlists
   */
  previousPlaylists() {
    //get the offset and total of playlists
    let total = this.state.playlists.total;
    let offset = this.state.offset

    // If the offset is equal to zero and the total can be divided by 50, give me the last 50 playlists.
    if (offset === 0 && total % 50 === 0) {
        this.setState({
        offset: total - 50
      }) 
    // If the offset is equal to zero and total can't be divided by zero (the result will be a decimal number), set the offset equal to the first few playlists till the total
    // can be divided by zero. e.g. The total = 530, the offset will be equal to 30.
      } else if (offset === 0 && total % 50 !== 0) {
        this.setState({
        offset: total - (total % 50)
      })
    /// Set the offset equal to the previous offset minus 50.
      } else {
        this.setState({
        offset: offset - 50
      })
    }
  }

  /**
   * Create hovering style for album cover.
   */
  albumHover() {
    $('.playbutton').hover(() => {
      $('.albumart').css('filter', 'blur(1.2px)')
      $('.playpause').css('opacity', '100%')
    }, () => {
      $('.albumart').css('filter', 'blur(0)')
      $('.playpause').css('opacity', '0')
    }
    )
  }

  /**
   * Execute the following code if the VirtualDOM has loaded.
   */
  componentDidMount() {
    this.getNowPlaying();
    this.getUser();
    this.getPlaylist();
    this.interval = setInterval(() => this.getNowPlaying(), 500);
    this.interval = setInterval(() => this.getPlaylist(), 500);
  }

  /**
   * Execute the following code if the VirtualDOM has unloaded.
   */
  componentWillUnmount() {
    clearInterval(this.interval);
    this.logOut();
  }

  /**
   * Render the following code.
   */
  render() {
    // Set the width equal to progress of the song.
    const progressBarStyles = {
      width: (this.state.nowPlaying.progress_ms * 100 / this.state.nowPlaying.itemDuration) + 'vw'
    };

    var playlist = [];
    // Retrieve all playlists and render them.
    for (var i = 0; i < this.state.playlists.name.length; i++) {
      playlist.push(<div uri={this.state.playlists.uri[i]} onClick={this.startPlaylist} className="playlist-div" id={this.state.playlists.id[i]}>
        <img className="playlist-img" src={this.state.playlists.img[i]} />
        <p className="playlist-text">{this.state.playlists.name[i]}</p>
      </div>);
    }
    return (
      <div className="App">
        <div className="menu">
          <img className="spotifylogo" src={logo} />
          {!this.state.loggedIn && (
            <a href='http://localhost:8888/login' ><button className="login">Login with Spotify</button></a>
          )
          }
          {this.state.loggedIn && (
            <div className="profileinfo">
              <div>
                <img className="profileimg" src={this.state.nowLogged.profileImg} />
              </div>
              <div className="profilename">
                {this.state.nowLogged.user}
                <div>
                  <button onClick={() => this.logOut()} className="logout">Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>
        {this.state.loggedIn && this.state.playing && (
          <div id="parent-playlist-div">
            <div id="parent-playlist">{playlist}</div>
            <div id="playlist-bar">
              <div id="playlist-arrows-wrapper">
                <div onClick={() => this.previousPlaylists()}><FontAwesomeIcon icon={faArrowLeft} /></div>
                <div onClick={() => this.nextPlaylists()}><FontAwesomeIcon icon={faArrowRight} /></div>
              </div>
            </div>
          </div>
        )}
        {this.state.loggedIn && (
          <div className="divnowplaying">
            {this.state.playing && (
              <div>
                <button className="previous" onClick={() => this.previousTrack()}><FontAwesomeIcon icon={faStepBackward} /></button>
              </div>
            )}
            <div className="player">
              {this.state.playing && (
                <button className="playbutton" onClick={this.state.is_playing ? this.pause : this.play} onMouseEnter={this.albumHover}>
                  <img className="albumart" src={this.state.nowPlaying.albumArt} />
                  <div className="playpause">{this.state.is_playing ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}</div>
                </button>
              )}
              {this.state.playing && (
                <div className="shufflerepeat">
                  <div>
                    <button id={this.state.nowPlaying.shuffleState ? "on" : "off"} className="playerbutton" onClick={this.shuffle}>
                      <FontAwesomeIcon icon={faRandom} />
                    </button>
                  </div>
                  <div>
                    <button id={this.state.nowPlaying.repeatState === 'context' || this.state.nowPlaying.repeatState === 'track' ? "on" : "off"} onClick={this.repeat} className="playerbutton"><FontAwesomeIcon icon={faRetweet} /> {this.state.nowPlaying.repeatState === 'track' && <sup>1</sup>}
                    </button>
                  </div>
                </div>
              )}
              <div className="song">
                {this.state.nowPlaying.name}
              </div>
              <div className="artist">
                {this.state.nowPlaying.artist}
              </div>
            </div>
            {this.state.playing && (
              <div>
                <button className="skip" onClick={() => this.skipTrack()}><FontAwesomeIcon icon={faStepForward} /></button>
              </div>
            )}
          </div>
        )}
        {this.state.loggedIn && (
          <div className="progressbar">
            <div className="progress" style={progressBarStyles}></div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
