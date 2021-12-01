import React, { Component } from 'react';
import firebase from 'firebase';

import FileUpload from './FileUpload';
import './App.css';

class App extends Component {

  constructor () {
    super();
    this.state = {
      user: null,
      pictures: []
    };
    this.handleAuth = this.handleAuth.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }

  componentWillMount () {
    firebase.auth().onAuthStateChanged(user => {
      this.setState({ user });
    });

    firebase.database().ref('pictures').on('child_added', snapshot => {
      this.setState({
        pictures: this.state.pictures.concat(snapshot.val())
      });
    });
  }

  handleAuth () {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(result => console.log(`${result.user.email} Ha iniciado Sesión`))
      .catch(error => console.log(`Error ${error.code}: ${error.message}`));
  }

  handleLogout ()  {
    firebase.auth().signOut()
    .then(result => console.log(`Has Salido`))
    .catch(error => console.log(`Error ${error.code}: ${error.message}`));
  }

  handleUpload (event) {
    //Obtenermos el fichero en evento OnChange
    const file = event.target.files[0];
    const storageRef = firebase.storage().ref(`/fotos/${file.name}`);
    const task = storageRef.put(file);

    //Obtenemos el estado por subir las imagenes a firebase
    task.on('state_changed', snapshot => {
      let percentaje = (snapshot.bytesTransferred/snapshot.totalBytes) * 100;
      this.setState({
        uploadValue: percentaje
      });
    }, error => { console.log(error.message)
    }, () => {
        const record = {
          photoURL: this.state.user.photoURL,
          displayName: this.state.user.displayName,
          image: task.snapshot.downloadURL
        };

        const dbRef = firebase.database().ref('pictures');
        const newPicture = dbRef.push();
        newPicture.set(record);
    });
  }

  renderLoginButton () {
    // Por usuario logueado
    if (this.state.user){
      return (
       <div>
        <img src={this.state.user.photoURL} alt={this.state.user.displayName} width="100"/>
        <p>Hola {this.state.user.displayName}!</p>
        <button onClick={this.handleLogout}>Salir</button>
        <FileUpload onUpload={this.handleUpload}/>
        {
          this.state.pictures.map(picture => (
            <div>
              <img src={picture.image}/><br/>
              <img width="50" src={picture.photoURL} alt={picture.displayName}/><br/>
              <span>{picture.displayName}</span>
            </div>
          )).reverse()
        }
       </div>
      );
    } else {
      return (
        <center>
        <button onClick={this.handleAuth}>Iniciar Sesión</button>
        </center>
      );
    }
    //Por sesión no iniciada
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Muro Interactivo</h2>
        </div>
        <p className="App-intro">
          {this.renderLoginButton()}
        </p>
      </div>
    );
  }
}

export default App;
