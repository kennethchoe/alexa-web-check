# Alexa Skill *Web Check* #

This repository contains entire source code to implement [**Web Check**](https://www.amazon.com/dp/B01M4NX2TM/ref=syps?s=digital-skills&ie=UTF8&qid=1484227856) - an Alexa skill with Account Linking using *Login with Amazon* integration.

Web Check is an Alexa skill that checks if any website is up. User can visit [alexa.agilesalt.com](https://alexa.agilesalt.com) to register websites, and say *Alexa, ask Web Check to check my sites*. Registered websites are saved on DynamoDB.

[Click to see System Overview.](https://alexa.agilesalt.com/Content/diagram.png)


# How to Build Your Own #

### Helpful Links ###

[letsencrypt-win-simple](https://github.com/Lone-Coder/letsencrypt-win-simple/wiki) - configure your website with https for free.

[Alexa Skill Testing Tool](https://echosim.io) - you can develop and test Alexa skill without buying Amazon Echo.

### Amazon Configuration ###

Amazon documentation is rather sporatic. I documented what I remember - if you hit any issues, let me know. I will update my explanation.

1. Follow steps described in [Create Alexa skill with Login with Amazon](https://developer.amazon.com/blogs/post/Tx3CX1ETRZZ2NPC/alexa-account-linking-5-steps-to-seamlessly-link-your-alexa-skill-with-login-with-amazon) to create Login with Amazon (LWA) Security Profile and an Alexa skill.
2. On LWA Security Profile - Web Settings, specify Allowed Origins as your web site to be published, e.g. "https://alexa.agilesalt.com". Keep in mind that it accepts https only.
3. On [IAM](https://console.aws.amazon.com/iam/home?region=us-east-1#/roles), create IAM Role - attach AWSLambdaBasicExecutionRole and AmazonDynamoDBFullAccess policy.
4. [Set up IAM User](http://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/net-dg-signup.html) with the role you made on step #3.

[developer.amazon.com](https://developer.amazon.com) is where you configure Alexa skill (under ALEXA) and Login with Amazon (under APPS & SERVICES).

[console.aws.amazon.com](https://console.aws.amazon.com) is where you manage Lambda functions, IAM and DynadmoDB.

### Dev Machine Configuration ###

Pre-requisite: Visual Studio 2015

1. Download source code.
2. Run `ci.bat` on the root.
Create c:\config folder and put these two files. You can change the location as long as you change corresponding App.config and Web.config in the source code.

c:\config\aws_profiles.txt:
```bat
[default]
aws_access_key_id=(get this value from Amazon Configuration step #4 - Set up IAM User)
aws_secret_access_key=(get this value from Amazon Configuration step #3 - Set up IAM User)
```

c:\config\amazon_client_config.txt:
```json
{
	"AmazonClientId": "(get this value from Amazon Configuration step #1, LWA Security Profile)",
	"AccessTokenForTest": "(get this value from Web Server Configuration step #4)"
}
```

### Web Server Configuration ###

1. After running ci.bat on dev machine, your package is available on ...\build\package. Copy that to somewhere on the web server.
2. Run the following on the web server, as administrator.

```bat
cd <root of the copied package>
set webSite=(your website name, e.g. Default Web Site)
tools\psake\psake.cmd deploy
```

3. Configure https on your site. Your published URL must match with what you specified on Amazon Configuration step #2.
4. Copy c:\config to web server's c:\config.

### Developing without Publishing ###

####Web server development:####
1. Launch your web site using published web site URL.
2. Login with Amazon.
3. On the home page, you will see Access Key text box. Copy the value and paste it onto c:\config\amazon_client_config.txt AccessTokenForTest.
4. Open src\Web.sln
5. Run. You should see login page. When you click Login with Amazon, it will skip actual login screen from Amazon.

####Lambda function development:####
You can use Atom to run javascript function locally. This is how I did:

1. Install [node.js](https://nodejs.org/).
2. Install [ATOM](https://atom.io/).
3. Install [Atom Script package](https://atom.io/packages/script).
4. run `npm update` on ...\src\Alexa folder.
5. Open ...\src\Alexa folder from Atom.
6. Put test code in your .js and run it. See ...\src\test.js as an example.

This way, you can test everything except an interaction with Alexa's call and DynamoDB.

# Gotchas #

1. Amazon Region matters on [console.aws.amazon.com](https://console.aws.amazon.com/). Read Amazon's documentation carefully. As of this moment, you can use US East (N. Virginia) only for Alexa development. Not sure how long this will be the case.
2. When your Lambda function uses more than basic node.js packages, [you need to upload a zip file that contains source .js along with node_modules](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html).
3. Before you submit your skill, make sure you test your own following [Alexa Skills Kit Voice Interface and User Experience Testing for Custom Skills](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing). If you don't satisfy any of them, your skill will not be certified.
4. Before you submit your skill, create a version for your Lambda function and link that to your Alexa skill.