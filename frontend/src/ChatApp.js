import { html, css } from 'lit';
import 'https://d3gqxi2jfoiztu.cloudfront.net/aws-dynamodb/aws-dynamodb.js';
import 'https://d3gqxi2jfoiztu.cloudfront.net/aws-sqs/aws-sqs.js';
import { AwsAuthorization, getUserInfo } from 'https://d3gqxi2jfoiztu.cloudfront.net/aws-authorization/AwsAuthorization.js';

export class ChatApp extends AwsAuthorization {
  static get properties() {
    return {
      username: String,
      email: String,
      lastMsgTime: Number,
      messages: Array,
      selectedItem: Object
    };
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        text-align: center;
      }

      main {
        width: 90%;
        overflow: auto;
        height: calc(100vh - 220px);
        margin-bottom: 4px;
        background-color: white;
      }

      main p {
        margin: 5px;
        text-align: left;
        cursor: pointer;
      }

      main p.r {
        text-align: right;
      }

      main p span {
        display: block;
        font-size: 12px;
        color: #ccc;
      }

      span[hidden] {
        display: none;
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }
    `;
  }

  constructor() {
    super();
    this.globalNotif = "globalchat";
    this.lastMsgTime = new Date().getTime() - 3600000;
    this.messages = [];
  }

  firstUpdated() {
    fetch('./src/config.json').then(response => { // load the file data
      return response.json()
    }).then(json => {
      console.log(json)
      this.region = json.region;
      this.userPoolName = json.prefix;
      this.clientId = json.clientId;
      this.apiId = json.apiId;
      this.defaultNotif = true;
      this.autoRefreshToken = true;
      super.firstUpdated();
    })
  }

  render() {
    return html`
      <h1>CHAT APP</h1>
      <button @click=${this.login} ?hidden=${this.auth}>Login</button>
      <div ?hidden=${!this.auth}>
        <label>Hi, ${this.username}</label><br>
        <button @click=${this.logout}>Logout</button>
      </div>
      <main ?hidden=${!this.auth}>
        ${this.messages.map(item=>
          html`
            <p class="txtMsg ${item.email==this.email?'r':''}"
              @click=${e=>this.selectMessage(e, item)}>
              ${item.message}
              <span ?hidden=${this.email==item.email}>${item.email}</span>
            </p>
          `
        )}
      </main>
      <p class="app-footer" ?hidden=${!this.auth}>
        <input type='text' placeholder="message" @keypress=${this.msgEnter}>
        <button id='btnSend' @click=${this.send}>Send</button>
        <button id='btnEdit' @click=${this.edit} hidden=true>Edit</button>
        <button id='btnRemove' @click=${this.remove} hidden=true>Remove</button>
      </p>
      <aws-dynamodb @dbReady=${this.dbReady}></aws-dynamodb>
      <aws-sqs queueName="globalchat" @sqsReady=${this.sqsReady} @after-get-message=${this.populateHistory}></aws-sqs>
    `;
  }

  get history() {
    return this.shadowRoot.querySelector('main')
  }

  get message() {
    return this.shadowRoot.querySelector("input")
  }

  get db() {
    return this.shadowRoot.querySelector("aws-dynamodb")
  }

  get sqs() {
    return this.shadowRoot.querySelector("aws-sqs")
  }

  get btnSend() {
    return this.shadowRoot.querySelector('button#btnSend')
  }

  get btnEdit() {
    return this.shadowRoot.querySelector('button#btnEdit')
  }

  get btnRemove() {
    return this.shadowRoot.querySelector('button#btnRemove')
  }

  selectMessage(e, item) {
    if (item.email == this.email) { // my message item, show update / delete options
      // no selected item
      if (e.target.style.backgroundColor == "rgb(187, 187, 187)" && e.target.style.color == "rgb(255, 255, 255)") {
        e.target.style.backgroundColor = ""
        e.target.style.color = "#000"
        this.message.value = ""
        this.btnSend.hidden = false
        this.btnEdit.hidden = true
        this.btnRemove.hidden = true
        this.selectedItem = null
      } else { // found selected item
        let txtMsg = this.shadowRoot.querySelectorAll('p.txtMsg')
        txtMsg.forEach(p => {
          p.style.backgroundColor = ""
          p.style.color = "#000"
        })
        e.target.style.backgroundColor = "#bbb"
        e.target.style.color = "#fff"
        this.message.value = item.message
        this.btnSend.hidden = true
        this.btnEdit.hidden = false
        this.btnRemove.hidden = false
        this.selectedItem = item
      }
    }
  }

  authorized() {
    super.authorized()
    // cross model, set arg3 = true
    // host model, arg3 = false (default value)
    this.db.setLocalConfig(this.userPoolName, this.region, true)
    this.sqs.setLocalConfig(this.userPoolName, this.region, true)
    this.username = getUserInfo()['cognito:username'];
    this.email = getUserInfo().email;
  }

  dbReady(e) {
    e.target.leadingKey = "globalchat"
  }

  sqsReady() {
    this.sqs.getMessage(true)
    this.populateHistory()
  }

  populateHistory() {
    this.db.query({
      KeyConditionExpression: "LeadingKey = :l and SortKey >= :s",
      ExpressionAttributeValues: {
        ":l": "globalchat",
        ":s": ''+this.lastMsgTime
      }
    }).then(r => {
      console.log(r.Items)
      this.messages = r.Items
      this.resetForm()
    }).catch(e => {
      console.log(e)
    })
  }

  async send() {
    if (this.message.value) {
      this.db.sortKey = ''+ new Date().getTime();
      let newMsg = {
        LeadingKey: "globalchat",
        SortKey: this.sortKey,
        email: this.email,
        message: this.message.value
      }
      this.messages = [
        ...this.messages,
        ...[newMsg]
      ]
      try {
        this.db.putItem({ 
          email: this.email,
          message: this.message.value
        })
      } catch(e) {
        console.log(e)
        let findIdx = this.messages.findIndex(m => m.SortKey == newMsg.SortKey && m.email == newMsg.email)
        this.messages.splice(findIdx, 1);
      }
      this.resetForm()
    }
  }

  async edit() {
    if (this.message.value) {
      this.db.sortKey = this.selectedItem.SortKey;
      let findIdx = this.messages.findIndex(m => m.SortKey == this.selectedItem.SortKey && m.email == this.selectedItem.email)
      let oldMsg = this.messages[findIdx].message
      this.messages[findIdx].message = this.message.value
      try {
        this.db.updateItem({
          UpdateExpression: 'set message = :m',
          ExpressionAttributeValues: {
            ':m' : this.message.value
          }
        })
      } catch(e) {
        console.log(e)
        this.messages[findIdx].message = oldMsg;
      }
      this.resetForm()
    }
  }

  async remove() {
    this.db.sortKey = this.selectedItem.SortKey;
    let findIdx = this.messages.findIndex(m => m.SortKey == this.selectedItem.SortKey && m.email == this.selectedItem.email)
    this.messages.splice(findIdx, 1);
    try {
      this.db.deleteItem()
    } catch(e) {
      console.log(e)
      this.messages[findIdx] = this.selectedItem
    }
    this.resetForm()
  }

  resetForm() {
    let txtMsg = this.shadowRoot.querySelectorAll('p.txtMsg')
    txtMsg.forEach(p => {
      p.style.backgroundColor = ""
      p.style.color = "#000"
    })
    this.message.value = ""
    this.btnSend.hidden = false
    this.btnEdit.hidden = true
    this.btnRemove.hidden = true
    this.selectedItem = null
    this.requestUpdate()
    setTimeout(() => {
      this.history.scrollTop = this.history.scrollHeight;
    })
  }

  msgEnter(e) { 
    if (e.keyCode == 13) {
      if (this.btnSend.hidden) {
        this.edit()
      } else {
        this.send() 
      }
    }
  }
}
