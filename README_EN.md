# Kurumi

<div align=center>
    <img src="./src/images/avatars/kurumi.png" width=16%>
</div>

> Hi! I'm Kurumi, a lightweight, embeddable chat assistant component packaged using webpack. It aims to package all JS scripts, CSS style sheets, plugins, and static files into a single JS file for easy integration into existing B/S architecture projects.

<div align=center>
    <a href="./README.md">Chinese Documentation</a> | <a href="./README_EN.md">English Documentation</a>
</div>

## Features

- 📱 **Lightweight Component**: Single JS file import, quick integration into any webpage
- 🎨 **Theme Support**: Built-in light and dark modes, freely switchable
- 💬 **Multimodal Interaction**: Support for text and image input for richer conversation experiences
- 📝 **Markdown Support**: Automatically render Markdown formatted message content
- 🔄 **Session Management**: Support for creating, saving, and switching between multiple sessions
- 🔧 **Custom Applications**: Configurable multiple preset applications/assistants, each with independent prompts and functional positioning
- 🎯 **Model Switching**: Support for switching between multiple AI models
- 💾 **Local Storage**: Uses IndexDB to save chat history, ensuring data persistence

## Project Advantages

### Pure Frontend Architecture, Seamless Integration
- **Zero Backend Dependencies**: Adopts pure frontend architecture design, deployment complete with a single JavaScript file
- **Cross-System Integration**: Can be easily embedded in any B/S mode system, quickly empowering existing projects with AI capabilities
- **Standalone Operation**: Simply import the packaged JS file to run independently, no additional configuration or backend services required
- **Plug and Play**: Supports quick integration in both new and old systems, significantly reducing development and deployment costs

### Basic Technology Stack, Extreme Compatibility
- **Lightweight Implementation**: Built on native JavaScript and jQuery, avoiding heavy frameworks
- **Wide Compatibility**: Not dependent on specific frontend frameworks (such as Vue, React), compatible with almost all B/S systems
- **Low Invasiveness**: Isolated through CSS namespace, minimizing impact on the host system
- **Efficient Loading**: Optimized resource packaging strategy to ensure fast loading and response in various environments

### Modular Design, Easy to Extend
- **Clear Code Structure**: Adopts modular architecture, core functions are split into independent modules (util.js, config.js, api.js, etc.)
- **Unified Entry Management**: Uses index.js as a unified entry for easy maintenance and management
- **Development Friendly**: Development mode mimicking modern frontend frameworks, reducing the learning threshold for secondary development
- **Flexible Expansion**: Supports custom model configuration, application configuration, and interface customization to meet different scenario requirements

## Environment Requirements
nodejs>=20
npm>=10

## Technology Stack

- **Frontend Framework**: Native JavaScript + jQuery
- **Style Processing**: Native CSS + Bootstrap Icons + Font Awesome
- **Packaging Tool**: Webpack 5
- **Code Transpilation**: Babel
- **UI Components**: Layer popups, SimpleMDE editor
- **Data Storage**: IndexDB
- **AI Interface**: Supports VLLM, Ollama, OpenAI and other large model services compatible with OpenAI API format

## Quick Start

* Clone the code:

```shell
git clone https://github.com/Midas/kurumi.git
```

* Initialize:

```shell
npm run init
```

* Build:

``` shell
npm run build
```

Packaged files are in the dist directory: ./dist/kurumi-chat.js. A sample HTML file (index.html) has been created in the project root directory. You can use nginx to publish this page or open the file directly in a browser to view the component effects.

Note: The index.html page is for testing purposes only. To test the complete functionality, you need to configure the actual AI model interface address, application configuration and other parameters in the index.html page.

## Installation and Usage

### Import Method

1. **Directly Import the Packaged File**

```html
<!-- Import at the bottom of the HTML page -->
<script src="path/to/kurumi-chat.js"></script>
<script>
    // Initialize KurumiChat
    const kurumiChat = new KurumiChat({
        theme: 'light', // Optional: 'light' or 'dark'
        title: 'Kurumi',
        userId: 'Midas888',
        userName: 'Midas',
        currentModel: customModels,
        currentApp: customApps
    });
    
    // Initialize the chat component
    kurumiChat.chat.init();

```

    // APP configuration example
    const customApps = [
            {
                id: "0b14a19f-d5c6-4ae9-aa9f-c57a2b5fac59",
                index: 0,
                name: "Programming Knowledge Assistant",
                description: "A professional programming knowledge assistant that can answer programming-related questions.",
                prompt: "You are a professional programming knowledge assistant who can answer programming-related questions. Please answer questions based on the user's inquiry.",
                // Note: Icon URL is from Flaticon, copyright belongs to Flaticon, used here for testing only
                img: "https://cdn-icons-png.flaticon.com/128/6601/6601223.png"
            },
            {
                id: "b5db9320-17f4-4a55-bcae-53e73f26d395",
                index: 1,
                name: "Song Lyric Expert",
                description: "A professional song lyric expert who can create song lyrics that meet user needs.",
                prompt: "You are a professional song lyric expert who can create song lyrics that meet user needs. Please create song lyrics based on user requirements.",
                // Note: Icon base64 is from iconfont, copyright belongs to iconfont, used here for testing only
                img: "data:image/png;base64,iVBORw0KGgoAAAANS......"
            },
            {
                id: "a6bde728-7f69-b16c-79da-4ff05c1f14b2",
                index: 2,
                name: "Image Recognition Expert",
                description: "A professional image recognition expert who can recognize images uploaded by users and return recognition results based on user questions about image content.",
                prompt: "You are a professional image recognition expert who can recognize images uploaded by users and return recognition results based on user questions about image content. Please perform recognition based on the images uploaded by users.",
                // Note: Icon base64 is from iconfont, copyright belongs to iconfont, used here for testing only
                img: "https://cdn-icons-png.flaticon.com/128/6384/6384343.png"
            },
            //...
        ];

        // Model configuration example (can be modified according to the actual deployed VLLM, Ollama and OpenAI models)
        const customModels = [
            {
                id: "a8c8a08a922f11f0923e0242ac190006", // VLLM interface
                serverUrl: "http://10.26.24.28:8000",
                modelName: "Qwen3-8B",
                apiPath: "/v1/chat/completions", // VLLM standard API path
                apiKey: "sk-1234567890abcdef1234567890abcdef", // Replace with actual API key
            },
            {
                id: "b94451f2922f11f0aaee0242ac190006", // VLLM interface
                serverUrl: "http://10.26.24.28:8001",
                modelName: "Qwen2.5-7B-Instruct",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // Replace with actual API key
            },
            {
                id: "769d7160-3048-45a4-a1cb-aa3d3f03f9cb", // Ollama interface
                serverUrl: "http://10.26.24.27:11434",
                modelName: "qwen2.5:0.5b",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // Replace with actual API key
            },
            {
                id: "8910efc2-4ed9-e808-7214-975cf122b625", // Ollama multimodal large model interface
                serverUrl: "http://10.26.24.27:11434",
                modelName: "minicpm-v:8b",
                apiPath: "/v1/chat/completions",
                apiKey: "sk-1234567890abcdef1234567890abcdef", // Replace with actual API key
            },
        ];
</script>

## Configuration Instructions

### Initialization Configuration Items

```javascript
const options = {
    theme: 'light', // Theme mode, optional 'light' or 'dark'
    title: 'Kurumi Assistant', // Chat window title
    userId: 'default_user', // User ID, used for session storage
    userName: 'User', // User name
    allModels: [], // Optional model list
    currentModel: {}, // Currently used model
    customApps: [], // Custom application list
    currentApp: {} // Currently used application
};
```

### Model Configuration Example

```javascript
const demoModel = {
    id: 'model-id',
    serverUrl: 'http://api.example.com', // Model service address
    modelName: 'model-name', // Model name
    apiPath: '/v1/chat/completions', // API path
    apiKey: 'your-api-key' // API key (optional)
};
```

### Application Configuration Example

```javascript
const demoApp = {
    id: 'app-id',
    name: 'Programming Assistant', // Application name
    description: 'Professional programming knowledge assistant', // Application description
    prompt: 'You are a professional programming knowledge assistant...', // System prompt
    img: 'https://example.com/icon.png' // Application icon, supports image links and Base64 encoding
};
```

## Development Guide

### Project Structure

```
kurumi/
├── src/
│   ├── css/            # Style files
│   ├── images/         # Image resources
│   ├── libs/           # Third-party libraries
│   ├── models/         # Core models
│   │   ├── api.js      # API interface encapsulation
│   │   ├── config.js   # Configuration file
│   │   └── util.js     # Utility functions
│   └── index.js        # Main entry file
├── index.html          # Sample page
├── package.json        # Project dependencies
├── webpack.config.js   # Webpack configuration
└── readme.md           # Project description
```

### Core Function Modules

1. **Chat Core Logic**
   - Session management (creation, loading, saving)
   - Message processing (sending, receiving, editing)
   - Image processing (uploading, previewing, Base64 conversion)

2. **UI Interaction**
   - Popup management (Layer)
   - Editor integration (SimpleMDE)
   - Theme switching

3. **Data Storage**
   - IndexDB session storage
   - Local cache management

4. **API Communication**
   - Stream message reception
   - Multimodal support
   - Error handling

## Plugin Dependencies

### Dependencies Installed via npm

| Dependency Name | Version | Purpose |
|-----------------|---------|----------|
| bootstrap-icons | ^1.13.1 | Provide vector icons |
| font-awesome | ^4.7.0 | Provide icon fonts |
| simplemde | ^1.11.2 | Markdown editor |

### Local Dependencies Introduced via webpack Configuration

| Dependency Name | Version | File Location | Purpose |
|-----------------|---------|---------------|----------|
| jQuery | 3.7.1 | src/libs/jquery-3.7.1.min.js | DOM manipulation and event handling |
| marked | 0.3.19 | src/libs/marked-0.3.19.min.js | Markdown parsing |
| layer | - | src/libs/layer/layer.js | Popup component |

### Development Dependencies

| Dependency Name | Version | Purpose |
|-----------------|---------|----------|
| webpack | ^5.100.2 | Module bundler |
| webpack-cli | ^6.0.1 | Webpack command line tool |
| @babel/core | ^7.28.0 | JavaScript compiler |
| @babel/preset-env | ^7.28.0 | Babel preset configuration |
| babel-loader | ^10.0.0 | Webpack's Babel loader |
| css-loader | ^7.1.2 | Process CSS files |
| style-loader | ^4.0.0 | Inject CSS into DOM |
| imports-loader | ^5.0.0 | Modify module exports |

## Component Secondary Development

To improve the integration friendliness and user experience of the project, the following key modifications have been made to third-party components:

### Style Isolation and Namespace
- Added `kurumi-chat-` prefix to all CSS class names of the Layer popup component
- Effectively avoid conflicts and confusion with the host system's CSS styles
- Ensure style consistency when introduced in any system

### Localization and Interface Optimization
- Fully localized the SimpleMDE editor, including interface elements, button text, and prompt information
- Optimized typesetting and display effects in Chinese context
- Improved the user experience for Chinese users

### Theme Support Enhancement
- Deeply modified the component CSS to natively support light and dark theme modes
- Added theme switching capability for all UI elements (including Layer popups and SimpleMDE editor)
- Use CSS variables to implement unified management and dynamic switching of theme colors

### Plugin Adaptation and Customization
- Customized the interaction behavior and animation effects of the Layer popup according to project requirements
- Adjusted the style and functionality of the SimpleMDE editor to make it consistent with the overall UI style
- Preserved the core functionality of the original plugins while optimizing the integration experience

## Browser Compatibility

- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

## Dependency Library License Agreements

| Dependency Library | Version | License Agreement | Remarks |
|--------------------|---------|-------------------|----------|
| jQuery | - | MIT License | Frontend JavaScript library for DOM manipulation and event handling |
| Bootstrap Icons | - | MIT License | Icon library providing icons needed for the interface |
| Font Awesome | 4.7.0 | SIL OFL 1.1 | Font icon library, following SIL Open Font License |
| SimpleMDE | - | MIT License | Markdown editor |
| marked.js | - | MIT License | Markdown parsing library |
| layer.js | - | MIT License | Popup component library |

## This Project's License
This project is licensed under the <a href="./LICENSE">MIT</a> license.

### Advantages of the MIT License
1. **High Freedom**: Allows anyone to freely use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software
2. **Business Friendly**: Unlimited support for commercial use, very suitable for commercial projects
3. **Concise and Clear**: The agreement text is brief and easy to understand, reducing compliance risks
4. **Promote Propagation**: Loose terms contribute to the widespread propagation and adoption of the project
5. **Retain Attribution**: Only requires preserving the original author's copyright notice and license statement, maintaining the author's basic rights

## Notes

1. **API Key Security**: Do not hardcode real API keys in frontend code in production environments
2. **Image Size Limitations**: Default limits upload image size to 10MB
3. **Browser Support**: Requires browser support for modern JavaScript features and IndexDB
4. **CORS Configuration**: If AI services are deployed in different domains, CORS policies need to be properly configured
5. **When using third-party libraries**, please ensure compliance with their respective license agreement requirements

## Update Log

### v1.0.0
- Initial version release
- Support basic chat functionality
- Implement multimodal interaction
- Support theme switching and session management
