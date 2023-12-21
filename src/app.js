const express = require('express');
const bodyParser = require('body-parser');
const Rule = require('./database/user/rules.model');
const Action = require('./database/user/actions.model.js');
const ActionCampMapping = require('./database/user/actionCamp.js');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');


require('./db.js');

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('rules API!!!!');
});

// API to create slack rules
app.post('/rules', (req, res) => {
  const requestData = req.body; // Access the data sent in the POST request

  //console.log('Received data:', requestData);
  let rules = new Rule(requestData);

  // rules.save().catch((error) => console.log(error));
  let ruleSaved
  rules.save().then((savedRule) => {
    console.log('Rules successfully saved!');
    console.log('Saved rule:', savedRule);
    let rule_id = savedRule?._id.toString()
    let actionStored = savedRule?.action

    let actionSchema = {
      ruleId: rule_id,
      action: actionStored
    }

    console.log('ACT', actionSchema);

    let actions = new Action(actionSchema);
    actions.save().then((savedAction) => {
      console.log('Actions successfully saved!');
      console.log('Saved action:', savedAction);
    })


    console.log('rule_id:', rule_id, typeof (rule_id));
    //console.log(rule_id.match(/ObjectId\("(.+)"\)/)[1]);
  }).catch((error) => {
    console.error('Error saving rules:', error);
  });

  console.log('objectId', ruleSaved);
  res.status(200).json({ message: 'Data received successfully' });
});

// API to delete slack rules by Id.
app.delete('/rules/:id', async (req, res) => {
  const ruleId = req.params.id;

  if (!ruleId) {
    return res.status(400).json({ message: 'Rule ID is required' });
  }

  try {
    const deletedRule = await Rule.findByIdAndDelete(ruleId);
    if (!deletedRule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.status(200).json({ message: 'Rule successfully deleted' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to fetch all the rules
app.get('/getslackrules', async (req, res) => {
  try {
    const slackRules = await Rule.find({});
    res.status(200).json({ slackRules });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }

});

// API to fetch logs (true action campaign mappings).
app.get('/logs/excecuted', async (req, res) => {
  try {
    // Find unexecuted campaigns with unique campaign_id
    const campaigns = await ActionCampMapping.find({ isExecuted: true, campaign_id: { $ne: null } });

    // Check for results
    if (!campaigns.length) {
      return res.status(404).json({ message: 'No campaign logs found' });
    }
    // Send successful response
    res.status(200).json({ campaigns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to execute abort (undo/redo)
app.post('/aborted/:rule_id', async (req, res) => {
  try {
    // Get the campaign_id from the request parameter
    const rulesId = req.params.rule_id;
    const op = req.query.undo;

    const campaign = await Rule.findOne({ _id: rulesId });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.isAborted = op !== 'false';

    await campaign.save();

    res.status(200).json({ message: 'Rule undo operation executed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// APIs for the plugin

// API to fetch actions and campaigns mapping for the plugin.
app.get('/campaigns/unexcecuted', async (req, res) => {
  try {
    // Find unexecuted campaigns with unique campaign_id
    const campaigns = await ActionCampMapping.find({ isExecuted: false, campaign_id: { $ne: null } });

    // Check for results
    if (!campaigns.length) {
      return res.status(404).json({ message: 'No unexecuted campaigns found' });
    }
    // Send successful response
    res.status(200).json({ campaigns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to make campaign's isExecuted true from the plugin
app.post('/campaigns/execute/:campaign_id', async (req, res) => {
  try {
    // Get the campaign_id from the request parameter
    const campaignId = req.params.campaign_id;

    // Find the campaign with the specified ID
    const campaign = await ActionCampMapping.findOne({ campaign_id: campaignId });

    // Check if campaign exists
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Update isExecuted to true
    campaign.isExecuted = true;
    await campaign.save();

    // Send successful response
    res.status(200).json({ message: 'Campaign execution marked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const privateKey = fs.readFileSync(path.join(__dirname, 'private.key'));
const certificate = fs.readFileSync(path.join(__dirname, './bundle.crt'));

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(3000);

