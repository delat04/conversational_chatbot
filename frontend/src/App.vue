<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100" style="font-family: 'Syne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background: white">
    <!-- Header -->
    <div class="bg-white  border-b border-slate-200">
      <div class="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-transform overflow-hidden">
              <img src="/src/assets/316d7dcb011d5b29b8960194c3982a54.webp" alt="Athenaeum Logo" class="w-full h-full object-cover">
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black">
                Athenaeum
              </h1>
              <p class="text-sm text-slate-500 font-medium">Intelligent Knowledge Retrieval</p>
            </div>
          </div>

          <!-- Status indicators with pill UI -->
          <div class="flex items-center space-x-3">
            <!-- Backend Status Pill -->
            <div class="flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
              <div class="relative">
                <div class="w-2 h-2 rounded-full" :class="backendStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'"></div>
                <div v-if="backendStatus === 'Online'" class="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
              </div>
              <span class="text-sm font-semibold" :class="backendStatus === 'Online' ? 'text-green-700' : 'text-red-700'">
            {{ backendStatus }}
          </span>
            </div>

            <!-- Documents Count Pill -->
            <div class="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm font-semibold text-blue-700">{{ documents.length }}</span>
              <span class="text-sm font-medium text-slate-600">documents</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Navigation Tabs -->
      <!-- Navigation Tabs -->
      <div class="mb-8">
        <div class="inline-flex items-center gap-3 bg-white rounded-full shadow-md border border-slate-200 p-1.5" style="padding-left: 20px;
    padding-right: 20px;">
          <template v-for="(tab, index) in tabs" :key="tab.id">
            <button
                @click="activeTab = tab.id"
                :class="[
          'relative flex items-center space-x-2 px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-in-out transform',
          activeTab === tab.id
            ? 'bgcolor text-white shadow-lg scale-105'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-102'
        ]"
            >
              <component :is="tab.icon" class="w-5 h-5 transition-transform duration-300" :class="activeTab === tab.id ? 'scale-110' : ''" />
              <span class="text-sm">{{ tab.label }}</span>

              <!-- Active indicator dot -->
              <div v-if="activeTab === tab.id" class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm"></div>
            </button>

            <!-- Divider -->
            <div v-if="index < tabs.length - 1" class="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
          </template>
        </div>
      </div>


      <!-- Upload Tab -->
      <div v-if="activeTab === 'upload'" class="space-y-6">
        <div class="bg-white rounded-3xl  border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Upload Documents</h2>
                <p class="text-sm text-slate-500 mt-0.5">Expand your knowledge base with new files</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center gap-4">
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">{{ documents.length }} Total Files</span>
              </div>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">Ready to Upload</span>
              </div>
            </div>
          </div>


          <!-- Upload Area with Sunrise Arcs -->
          <div class="relative border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300 group overflow-hidden">

            <div class="w-[17rem] h-16 bg-transparent rounded-full flex items-center justify-center mx-auto">
              <img src="https://i.imgur.com/j1YxW1L.png" alt="icon for a folder" class="w-8 h-8 text-blue-600" style="    width: 22rem;
    height: 16rem;">

            </div>
            <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                accept=".pdf,.txt,.csv,.docx,.doc,.xlsx,.xls,.ppt,.pptx,.rtf,.odt,.json,.xml"
                class="hidden"
            />


            <!-- Center Content (Below arcs) -->
            <div class="relative space-y-6 z-10 pt-5">
              <div class="max-w-md mx-auto">
                <p class="text-2xl font-bold text-slate-900 mb-2">
                  {{ selectedFile ? '✓ ' + selectedFile.name : 'Drag & Drop Your File Here' }}
                </p>
                <p class="text-sm text-slate-500 mb-1">or click below to browse</p>
                <div class="flex flex-wrap justify-center gap-2 mt-4">
            <span v-for="format in ['PDF', 'DOCX', 'TXT', 'CSV', 'XLSX', 'PPTX']" :key="format"
                  class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              {{ format }}
            </span>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                    @click="$refs.fileInput.click()"
                    class="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                  Browse Files
                </button>

                <button
                    @click="uploadDocument"
                    :disabled="!selectedFile || uploading"
                    class="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  <svg v-if="uploading" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  {{ uploading ? 'Processing...' : 'Upload to Platform' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Progress Section -->
          <div v-if="uploadProgress > 0" class="mt-8 bg-gradient-to-r from-[#7786ec]/10 to-[#7786ec]/5 rounded-2xl p-6 border border-[#7786ec]/30">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-[#7786ec] rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-900">Uploading Document</p>
                  <p class="text-xs text-slate-500">Processing and indexing your file</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-2xl font-bold text-[#7786ec]">{{ uploadProgress }}%</span>
                <p class="text-xs text-slate-500">Complete</p>
              </div>
            </div>
            <div class="w-full bg-white rounded-full h-4 shadow-inner border border-slate-200">
              <div
                  class="bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] h-4 rounded-full transition-all duration-300 shadow-md relative overflow-hidden"
                  :style="{ width: uploadProgress + '%' }"
              >
                <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="uploadResult" class="mt-8 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
            <div class="flex items-start space-x-4 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-green-900 mb-1">Successfully Uploaded!</h3>
                <p class="text-sm text-green-700">Your document has been processed and added to the knowledge base</p>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-green-200 shadow-inner">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-600">Response Details</span>
                <button class="text-xs text-[#7786ec] hover:text-[#6675db] font-medium">View All</button>
              </div>
              <pre class="text-sm text-slate-700 overflow-x-auto max-h-40">{{ JSON.stringify(uploadResult, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      <!-- Add this to your existing tabs in the template -->
      <!-- Clustering Tab -->
      <div v-if="activeTab === 'clustering'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Document Clustering</h2>
                <p class="text-sm text-slate-500 mt-0.5">Organize and analyze documents with intelligent clustering</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center gap-3">
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">{{ clusters.length }} Clusters</span>
              </div>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">AI-Powered</span>
              </div>
            </div>
          </div>

          <!-- Sub-navigation for clustering features -->
          <div class="mb-8">
            <div class="bg-gradient-to-r from-slate-100 to-blue-50 rounded-2xl p-1.5 inline-flex space-x-1 border border-slate-200">
              <button
                  v-for="subtab in clusteringTabs"
                  :key="subtab.id"
                  @click="activeClusteringTab = subtab.id"
                  :class="[
            'px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm flex items-center space-x-2',
            activeClusteringTab === subtab.id
              ? 'bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          ]"
              >
                <component :is="icons[subtab.icon]" class="w-4 h-4" />
                <span>{{ subtab.label }}</span>
              </button>
            </div>
          </div>

          <!-- RAG Generation Tab -->
          <div v-if="activeClusteringTab === 'rag'" class="space-y-6">
            <!-- RAG Header -->
            <div class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-[#7786ec]/30">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-full flex items-center justify-center shadow-md">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">RAG Generation</h3>
                  <p class="text-slate-600">Generate intelligent responses using clustered document knowledge</p>
                </div>
              </div>
            </div>

            <!-- RAG Configuration -->
            <div class="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
              <div class="p-6 border-b border-slate-200">
                <h4 class="text-lg font-semibold text-slate-900 mb-4">Configuration</h4>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- RAG Method -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">RAG Method</label>
                    <select
                        v-model="ragMethod"
                        class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                    >
                      <option value="auto">Auto-routing</option>
                      <option value="explicit">Explicit Cluster</option>
                    </select>
                  </div>

                  <!-- Cluster Selection (only for explicit method) -->
                  <div v-if="ragMethod === 'explicit'">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Target Cluster</label>
                    <select
                        v-model="selectedClusterId"
                        class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                    >
                      <option value="">Select cluster...</option>
                      <option v-for="cluster in availableClusters" :key="cluster.id" :value="cluster.id">
                        {{ cluster.name }} ({{ cluster.document_count }} docs)
                      </option>
                    </select>
                  </div>

                  <!-- Max Clusters (only for auto method) -->
                  <div v-if="ragMethod === 'auto'">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Max Clusters</label>
                    <input
                        v-model.number="ragConfig.max_clusters"
                        type="number"
                        min="1"
                        max="5"
                        class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-center"
                    />
                  </div>

                  <!-- Context Limit -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Context Limit</label>
                    <input
                        v-model.number="ragConfig.context_limit"
                        type="number"
                        min="1"
                        max="10"
                        class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-center"
                    />
                  </div>
                </div>

                <!-- Advanced Settings Toggle -->
                <div class="mt-4">
                  <button
                      @click="showAdvancedRAGSettings = !showAdvancedRAGSettings"
                      class="text-sm text-[#7786ec] hover:text-[#5a6fd8] font-semibold flex items-center"
                  >
                    <svg class="w-4 h-4 mr-1.5" :class="{ 'rotate-180': showAdvancedRAGSettings }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                    {{ showAdvancedRAGSettings ? 'Hide' : 'Show' }} Advanced Settings
                  </button>
                </div>

                <!-- Advanced Settings -->
                <div v-if="showAdvancedRAGSettings" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-[#7786ec]/20">
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Temperature</label>
                    <input
                        v-model.number="ragConfig.temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                    />
                  </div>
                  <div class="flex items-center">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                          v-model="ragConfig.include_cluster_info"
                          type="checkbox"
                          class="h-5 w-5 text-[#7786ec] focus:ring-[#7786ec] border-slate-300 rounded"
                      />
                      <span class="text-sm font-semibold text-slate-700">Include cluster info</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Query Input -->
            <div class="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
              <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-slate-900">Query</h4>
                  <div class="flex space-x-2">
                    <button
                        @click="processBatchRAG"
                        :disabled="ragLoading"
                        class="px-4 py-2 text-xs font-semibold text-[#7786ec] bg-[#7786ec]/10 hover:bg-[#7786ec]/20 rounded-lg transition-all duration-200 disabled:opacity-50 border border-[#7786ec]/20"
                    >
                      Batch Process
                    </button>
                    <button
                        @click="clearRAGSession"
                        class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200 border border-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <textarea
                    v-model="ragQuery"
                    placeholder="Enter your question here... (For batch processing, enter one query per line)"
                    class="w-full h-32 px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] resize-none transition-all duration-200"
                    :disabled="ragLoading"
                ></textarea>

                <div class="flex justify-between items-center mt-4">
                  <div class="text-sm text-slate-500">
                    {{ ragQuery.length }} characters
                    <span v-if="ragQuery.includes('\n')" class="ml-2">
                • {{ ragQuery.split('\n').filter(q => q.trim()).length }} queries
              </span>
                  </div>

                  <button
                      @click="generateRAGResponse"
                      :disabled="ragLoading || !ragQuery.trim()"
                      class="inline-flex items-center px-6 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    <svg v-if="ragLoading" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                    {{ ragLoading ? 'Generating...' : 'Generate Response' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="ragError" class="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-5">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-red-900">Error</h4>
                  <p class="text-red-700 mt-1">{{ ragError }}</p>
                </div>
              </div>
            </div>

            <!-- RAG Response -->
            <div v-if="ragResult" class="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
              <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <h4 class="text-lg font-semibold text-slate-900">Response</h4>
                  <div class="flex space-x-2">
                    <button
                        @click="copyRAGResponse"
                        class="p-2 text-slate-400 hover:text-[#7786ec] hover:bg-[#7786ec]/10 rounded-lg transition-all duration-200"
                        title="Copy response"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Response Content -->
                <div class="prose max-w-none mb-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-[#7786ec]/20" v-html="marked(ragResponse)"></div>

                <!-- Response Metadata -->
                <div class="border-t border-slate-200 pt-6">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                      <div class="text-sm font-semibold text-slate-700">Method</div>
                      <div class="text-xl font-bold text-[#7786ec] capitalize mt-1">{{ ragResult.method?.replace('_', ' ') }}</div>
                    </div>
                    <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                      <div class="text-sm font-semibold text-slate-700">Clusters Used</div>
                      <div class="text-xl font-bold text-[#7786ec] mt-1">{{ ragResult.clusters_searched?.length || 0 }}</div>
                    </div>
                    <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                      <div class="text-sm font-semibold text-slate-700">Context Chunks</div>
                      <div class="text-xl font-bold text-[#7786ec] mt-1">{{ ragResult.total_context_chunks || 0 }}</div>
                    </div>
                  </div>

                  <!-- Clusters Used -->
                  <div v-if="ragResult.clusters_searched?.length" class="mb-6">
                    <h5 class="text-sm font-semibold text-slate-900 mb-3">Clusters Searched</h5>
                    <div class="flex flex-wrap gap-2">
                <span
                    v-for="cluster in ragResult.clusters_searched"
                    :key="cluster.id"
                    class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-[#7786ec]/10 text-[#7786ec] border border-[#7786ec]/30"
                >
                  {{ cluster.name }}
                  <span class="ml-2 opacity-75">({{ (cluster.relevance * 100).toFixed(0) }}%)</span>
                </span>
                    </div>
                  </div>

                  <!-- Sources -->
                  <div v-if="ragResult.sources?.length" class="space-y-2">
                    <h5 class="text-sm font-semibold text-slate-900 mb-3">Sources</h5>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                      <div
                          v-for="source in ragResult.sources"
                          :key="`${source.document_id}-${source.chunk_index}`"
                          class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 text-sm border border-[#7786ec]/20"
                      >
                        <div class="flex justify-between items-start mb-2">
                          <span class="font-semibold text-slate-900">{{ source.filename }}</span>
                          <div class="flex items-center space-x-2">
                      <span class="text-xs bg-[#7786ec]/20 text-[#7786ec] px-2.5 py-1 rounded-full font-semibold border border-[#7786ec]/30">
                        {{ source.cluster_name }}
                      </span>
                            <span class="text-xs text-slate-600 font-semibold">
                        {{ (source.score * 100).toFixed(0) }}%
                      </span>
                          </div>
                        </div>
                        <p class="text-slate-600 text-xs leading-relaxed">{{ source.text_preview }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RAG History -->
            <div v-if="ragHistory.length" class="bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
              <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-slate-900">Recent Queries</h4>
                  <button
                      @click="ragHistory = []"
                      class="text-sm text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    Clear History
                  </button>
                </div>

                <div class="space-y-3 max-h-96 overflow-y-auto">
                  <div
                      v-for="item in ragHistory"
                      :key="item.id"
                      class="border-2 border-slate-200 rounded-xl p-4 hover:border-[#7786ec] transition-all duration-200"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h6 class="font-semibold text-slate-900 text-sm">{{ item.query }}</h6>
                      <div class="flex items-center space-x-2 text-xs text-slate-500">
                        <span class="px-2 py-1 bg-[#7786ec]/10 text-[#7786ec] rounded-full font-medium">{{ item.clusters_used }} clusters</span>
                        <span>{{ item.timestamp }}</span>
                      </div>
                    </div>
                    <div class="text-sm text-slate-600 line-clamp-2" v-html="marked(item.response)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cluster Now Tab -->
          <div v-if="activeClusteringTab === 'cluster'" class="space-y-6">
            <div class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-[#7786ec]/30">
              <h3 class="text-xl font-bold text-slate-900 mb-6">Trigger Document Clustering</h3>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Clustering Method</label>
                    <select
                        v-model="clusteringMethod"
                        class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                    >
                      <option value="hierarchical">Hierarchical</option>
                      <option value="kmeans">K-Means</option>
                    </select>
                  </div>

                  <div class="flex items-center">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                          v-model="forceReclustering"
                          type="checkbox"
                          class="h-5 w-5 text-[#7786ec] focus:ring-[#7786ec] border-slate-300 rounded"
                      />
                      <span class="text-sm font-semibold text-slate-700">Force Re-clustering</span>
                    </label>
                  </div>
                </div>

                <button
                    @click="triggerClustering"
                    :disabled="clustering"
                    class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  <svg v-if="clustering" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  {{ clustering ? 'Clustering...' : 'Start Clustering' }}
                </button>
              </div>

              <!-- Clustering Status -->
              <div v-if="clusteringResult" class="mt-6 bg-white rounded-2xl p-6 border-2 border-green-300 shadow-md">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-green-900">Clustering Complete</h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                    <div class="font-semibold text-slate-700 text-sm">Clusters Created</div>
                    <div class="text-2xl font-bold text-[#7786ec] mt-1">{{ clusteringResult.clusters_created }}</div>
                  </div>
                  <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                    <div class="font-semibold text-slate-700 text-sm">Documents Processed</div>
                    <div class="text-2xl font-bold text-[#7786ec] mt-1">{{ clusteringResult.documents_processed }}</div>
                  </div>
                  <div class="bg-gradient-to-br from-[#7786ec]/10 to-blue-50 rounded-xl p-4 border border-[#7786ec]/20">
                    <div class="font-semibold text-slate-700 text-sm">Processing Time</div>
                    <div class="text-2xl font-bold text-[#7786ec] mt-1">{{ clusteringResult.processing_time }}s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- View Clusters Tab -->
          <div v-if="activeClusteringTab === 'clusters'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900">All Clusters</h3>
              <button
                  @click="fetchClusters"
                  :disabled="fetchingClusters"
                  class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-xl hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-200 shadow-lg"
              >
                <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': fetchingClusters }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ fetchingClusters ? 'Loading...' : 'Refresh' }}
              </button>
            </div>

            <div v-if="clusters.length === 0 && !fetchingClusters" class="relative border-2 border-dashed border-slate-300 rounded-2xl p-16 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300">
              <div class="text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-2">No clusters found</h3>
                <p class="text-slate-600">Run clustering first to organize your documents.</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                  v-for="cluster in clusters"
                  :key="cluster.id"
                  class="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-xl transition-all duration-300 group"
              >
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Folder class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 class="text-lg font-bold text-slate-900">{{ cluster.name }}</h4>
                      <p class="text-sm text-slate-500">{{ cluster.document_count }} documents</p>
                    </div>
                  </div>
                </div>

                <button
                    @click="viewClusterDocuments(cluster.id)"
                    class="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white rounded-xl hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-200 font-semibold shadow-md"
                >
                  View Documents
                </button>

                <!-- Show documents if expanded -->
                <div v-if="expandedCluster === cluster.id" class="mt-4 space-y-2">
                  <div
                      v-for="doc in clusterDocuments"
                      :key="doc.id"
                      class="bg-white rounded-xl p-3 border-2 border-slate-200"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-[#7786ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="font-semibold text-slate-900 text-sm">{{ doc.filename }}</span>
                      </div>
                      <div class="flex items-center space-x-2 text-xs text-slate-500">
                        <span class="px-2 py-1 bg-[#7786ec]/10 rounded-full">{{ doc.source_type }}</span>
                        <span>{{ new Date(doc.created_at).toLocaleDateString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clustered Search Tab -->
          <div v-if="activeClusteringTab === 'search'" class="space-y-6">
            <h3 class="text-xl font-bold text-slate-900">Cluster-Aware Search</h3>

            <div class="bg-white rounded-2xl border-2 border-slate-200 p-6">
              <div class="space-y-4">
                <div class="flex flex-col sm:flex-row gap-4">
                  <div class="flex-1">
                    <input
                        v-model="clusteredSearchQuery"
                        type="text"
                        placeholder="Enter your search query..."
                        class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                        @keyup.enter="performClusteredSearch"
                    />
                  </div>
                  <select
                      v-model="selectedClusterForSearch"
                      class="px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                  >
                    <option value="">All Clusters</option>
                    <option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
                      {{ cluster.name }}
                    </option>
                  </select>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <label class="text-sm font-semibold text-slate-700">Results limit:</label>
                    <input
                        v-model="clusteredSearchLimit"
                        type="number"
                        min="1"
                        max="20"
                        class="w-20 px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-center"
                    />
                  </div>

                  <button
                      @click="performClusteredSearch"
                      :disabled="!clusteredSearchQuery || clusteredSearching"
                      class="inline-flex items-center px-6 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    <svg v-if="clusteredSearching" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    {{ clusteredSearching ? 'Searching...' : 'Search' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Clustered Search Results -->
            <div v-if="clusteredSearchResults" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold text-slate-900">
                  Search Results
                </h4>
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-sm font-semibold text-[#7786ec]">{{ clusteredSearchResults.total_results }} Found</span>
                </div>
              </div>

              <div class="grid gap-4">
                <div
                    v-for="result in clusteredSearchResults.results"
                    :key="result.id"
                    class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-lg transition-all duration-300"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <span class="font-bold text-slate-900 text-lg">{{ result.filename }}</span>
                        <div class="flex items-center space-x-2 text-sm mt-1">
                <span v-if="result.cluster_name" class="px-2.5 py-1 bg-[#7786ec]/20 text-[#7786ec] rounded-full font-semibold text-xs border border-[#7786ec]/30">
                  {{ result.cluster_name }}
                </span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
            <span class="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
              {{ (result.score * 100).toFixed(1) }}% Match
            </span>
                    </div>
                  </div>

                  <div class="bg-white rounded-xl p-4 mb-3 border border-slate-200">
                    <p class="text-slate-700 leading-relaxed">{{ result.text }}</p>
                  </div>

                  <div class="flex items-center space-x-4 text-sm text-slate-500">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            ID: {{ result.document_id }}
          </span>
                    <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Chunk {{ result.chunk_index }}
          </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Similar Documents Tab -->
          <div v-if="activeClusteringTab === 'similar'" class="space-y-6">
            <h3 class="text-xl font-bold text-slate-900">Find Similar Documents</h3>

            <div class="bg-white rounded-2xl border-2 border-slate-200 p-6">
              <div class="space-y-4">
                <div class="flex flex-col lg:flex-row gap-4">
                  <!-- Document selection dropdown -->
                  <div class="flex-1 min-w-0">
                    <select
                        v-model="selectedDocumentForSimilarity"
                        class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200"
                    >
                      <option value="">Select a document...</option>
                      <option v-for="doc in enhancedDocuments" :key="doc.id" :value="doc.id">
                        {{ doc.filename }} ({{ doc.cluster_name || 'No cluster' }})
                      </option>
                    </select>
                  </div>

                  <!-- Limit input -->
                  <div class="flex items-center justify-between sm:justify-start space-x-3 lg:flex-shrink-0">
                    <label class="text-sm font-semibold text-slate-700 whitespace-nowrap">Limit:</label>
                    <input
                        v-model="similarityLimit"
                        type="number"
                        min="1"
                        max="10"
                        class="w-20 px-3 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-center"
                    />
                  </div>
                </div>

                <button
                    @click="findSimilarDocuments"
                    :disabled="!selectedDocumentForSimilarity || findingSimilar"
                    class="inline-flex items-center px-6 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  <svg v-if="findingSimilar" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                  </svg>
                  {{ findingSimilar ? 'Finding...' : 'Find Similar' }}
                </button>
              </div>
            </div>

            <!-- Similar Documents Results -->
            <div v-if="similarDocuments" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold text-slate-900">
                  Similar Documents
                </h4>
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-sm font-semibold text-[#7786ec]">{{ similarDocuments.length }} Found</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="doc in similarDocuments"
                    :key="doc.id"
                    class="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-xl transition-all duration-300 group"
                >
                  <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>

                    <span class="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
            {{ (doc.similarity * 100).toFixed(1) }}%
          </span>
                  </div>

                  <div class="flex-1">
                    <h4 class="text-lg font-bold text-slate-900 mb-2 line-clamp-2" :title="doc.filename">{{ doc.filename }}</h4>

                    <div class="space-y-2">
                      <div v-if="doc.cluster_name" class="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
              <span class="text-xs font-medium text-slate-600 flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-[#7786ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                Cluster
              </span>
                        <span class="text-sm font-bold text-[#7786ec]">{{ doc.cluster_name }}</span>
                      </div>

                      <div class="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
              <span class="text-xs font-medium text-slate-600 flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                Type
              </span>
                        <span class="text-sm font-semibold text-slate-700">{{ doc.source_type }}</span>
                      </div>

                      <div class="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
              <span class="text-xs font-medium text-slate-600 flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Created
              </span>
                        <span class="text-sm font-semibold text-slate-700">{{ new Date(doc.created_at).toLocaleDateString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Scrape Tab -->
      <div v-if="activeTab === 'scrape'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Web Scraping</h2>
                <p class="text-sm text-slate-500 mt-0.5">Extract content from websites automatically</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center gap-4">
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">{{ scrapeMethod.toUpperCase() }} Method</span>
              </div>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">Ready to Scrape</span>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="relative border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300 group">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </div>

            <div class="space-y-6 max-w-2xl mx-auto">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Website URL</label>
                <input
                    v-model="scrapeUrl"
                    type="text"
                    placeholder="Enter website URL (e.g., https://example.com)"
                    class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div class="flex-1">
                  <label class="block text-sm font-semibold text-slate-700 mb-3">Scraping Method</label>
                  <select
                      v-model="scrapeMethod"
                      class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900"
                  >
                    <option value="auto">Auto (Intelligent)</option>
                    <option value="cheerio">Cheerio (Fast)</option>
                    <option value="puppeteer">Puppeteer (Dynamic)</option>
                  </select>
                </div>

                <div class="flex items-center pt-8">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                        v-model="processImmediately"
                        type="checkbox"
                        class="h-5 w-5 text-[#7786ec] focus:ring-[#7786ec] border-slate-300 rounded"
                    />
                    <span class="text-sm font-semibold text-slate-700">Process Immediately</span>
                  </label>
                </div>
              </div>

              <div class="flex justify-center pt-4">
                <button
                    @click="scrapeWebsite"
                    :disabled="!scrapeUrl || scraping"
                    class="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  <svg v-if="scraping" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                  </svg>
                  {{ scraping ? 'Scraping Website...' : 'Start Scraping' }}
                </button>
              </div>

              <div class="flex flex-wrap justify-center gap-2 pt-2">
          <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            HTML Content
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Text Extraction
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Metadata
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Auto Processing
          </span>
              </div>
            </div>
          </div>

          <!-- Scrape Result -->
          <div v-if="scrapeResult" class="mt-8 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
            <div class="flex items-start space-x-4 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-green-900 mb-1">Scraping Successful!</h3>
                <p class="text-sm text-green-700">Website content has been extracted and processed</p>
              </div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-green-200 shadow-inner">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-600">Response Details</span>
                <button class="text-xs text-[#7786ec] hover:text-[#6675db] font-medium">View All</button>
              </div>
              <pre class="text-sm text-slate-700 overflow-x-auto max-h-40">{{ JSON.stringify(scrapeResult, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Tab -->
      <div v-if="activeTab === 'search'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Semantic Search</h2>
                <p class="text-sm text-slate-500 mt-0.5">Find relevant content across your knowledge base</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center gap-4">
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">{{ documents.length }} Documents</span>
              </div>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">AI-Powered</span>
              </div>
            </div>
          </div>

          <!-- Search Area -->
          <div class="relative border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300 group">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>

            <div class="space-y-6 max-w-3xl mx-auto">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Search Query</label>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Enter your search query... (e.g., 'machine learning algorithms')"
                    class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400"
                    @keyup.enter="performSearch"
                />
              </div>

              <div class="flex flex-col sm:flex-row gap-4 items-center">
                <div class="flex-1 w-full sm:w-auto">
                  <label class="block text-sm font-semibold text-slate-700 mb-3">Result Limit</label>
                  <input
                      v-model="searchLimit"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Limit"
                      class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 text-center"
                  />
                </div>

                <div class="flex justify-center pt-0 sm:pt-8 w-full sm:w-auto">
                  <button
                      @click="performSearch"
                      :disabled="!searchQuery || searching"
                      class="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    <svg v-if="searching" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    {{ searching ? 'Searching...' : 'Search Documents' }}
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap justify-center gap-2 pt-2">
          <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Semantic Search
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Vector Embeddings
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Similarity Scoring
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Instant Results
          </span>
              </div>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults && searchResults.results" class="mt-8">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <h3 class="text-xl font-bold text-slate-900">
                Search Results
              </h3>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-sm font-semibold text-[#7786ec]">{{ searchResults.total_results }} Found</span>
              </div>
            </div>

            <div class="grid gap-4">
              <div
                  v-for="result in searchResults.results"
                  :key="result.id"
                  class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-lg transition-all duration-300"
              >
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <span class="font-bold text-slate-900 text-lg">{{ result.filename }}</span>
                      <p class="text-xs text-slate-500">Document ID: {{ result.document_id }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
              <span class="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
                {{ (result.score * 100).toFixed(1) }}% Match
              </span>
                  </div>
                </div>

                <div class="bg-white rounded-xl p-4 mb-3 border border-slate-200">
                  <p class="text-slate-700 leading-relaxed">{{ result.text }}</p>
                </div>

                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center space-x-4 text-slate-500">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Chunk {{ result.chunk_index }}
              </span>
                    <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Score: {{ result.score.toFixed(4) }}
              </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-Research Tab -->
      <div v-if="activeTab === 'research'" class="space-y-6">
        <!-- Research Mode Selector -->
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Auto Research</h2>
                <p class="text-sm text-slate-500 mt-0.5">Intelligent research powered by AI</p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button
                  v-for="mode in [
              { id: 'auto', label: 'Smart Research', icon: 'Brain' },
              { id: 'quick', label: 'Quick Research', icon: 'Zap' },
              { id: 'custom', label: 'Custom Sources', icon: 'Target' }
            ]"
                  :key="mode.id"
                  @click="researchMode = mode.id"
                  :class="[
              'flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200',
              researchMode === mode.id
                ? 'bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            ]"
              >
                <component :is="mode.icon" class="w-4 h-4" />
                <span>{{ mode.label }}</span>
              </button>
            </div>
          </div>

          <!-- Research Query Input -->
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-3">Research Query</label>
              <input
                  v-model="researchQuery"
                  type="text"
                  placeholder="What would you like to research? e.g., 'Latest developments in AI'"
                  class="w-full px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400"
                  :disabled="researching"
              />
            </div>

            <!-- Auto/Quick Research Settings -->
            <div v-if="researchMode !== 'custom'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Max Sources</label>
                <select
                    v-model="researchMaxSources"
                    class="w-full px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900"
                    :disabled="researching"
                >
                  <option :value="1">1 Source (Fastest)</option>
                  <option :value="2">2 Sources</option>
                  <option :value="3">3 Sources (Recommended)</option>
                  <option :value="5">5 Sources</option>
                  <option :value="8">8 Sources (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Response Style</label>
                <select
                    v-model="researchConfig.response_options.response_style"
                    class="w-full px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900"
                    :disabled="researching"
                >
                  <option value="comprehensive">Comprehensive</option>
                  <option value="concise">Concise</option>
                  <option value="bullet-points">Bullet Points</option>
                </select>
              </div>
            </div>

            <!-- Custom Sources Input -->
            <div v-if="researchMode === 'custom'" class="space-y-3">
              <label class="block text-sm font-semibold text-slate-700">Custom URLs</label>
              <div v-for="(source, index) in customSources" :key="index" class="flex space-x-2">
                <input
                    v-model="customSources[index]"
                    type="url"
                    :placeholder="`URL ${index + 1}`"
                    class="flex-1 px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400"
                    :disabled="researching"
                />
                <button
                    v-if="customSources.length > 1"
                    @click="removeCustomSource(index)"
                    class="px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border-2 border-slate-200 hover:border-red-200 font-semibold"
                    :disabled="researching"
                >
                  ✕
                </button>
              </div>
              <button
                  @click="addCustomSource"
                  class="flex items-center space-x-2 text-[#7786ec] hover:text-[#5a6fd8] font-semibold transition-colors"
                  :disabled="researching || customSources.length >= 5"
              >
                <span>+ Add Another URL</span>
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-4 pt-4">
              <button
                  @click="researchMode === 'custom' ? performCustomSourceResearch() : performAutoResearch()"
                  :disabled="researching || !researchQuery.trim()"
                  class="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-xl hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                <component :is="researching ? 'Loader2' : 'Search'" :class="researching ? 'animate-spin' : ''" class="w-5 h-5 mr-2" />
                <span>{{ researching ? 'Researching...' : 'Start Research' }}</span>
              </button>

              <button
                  v-if="researchResult"
                  @click="clearResearchResults"
                  class="inline-flex items-center px-6 py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200 border border-slate-200"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>

        <!-- Research Results -->
        <div v-if="researchResult" class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900">Research Results</h3>
                <div class="flex space-x-4 text-sm text-slate-500 mt-1">
            <span class="flex items-center">
              <span class="w-1.5 h-1.5 bg-[#7786ec] rounded-full mr-2"></span>
              {{ researchResult.research_summary?.total_sources_processed || 0 }} sources
            </span>
                  <span class="flex items-center">
              <span class="w-1.5 h-1.5 bg-[#7786ec] rounded-full mr-2"></span>
              {{ formatResearchTime(researchResult.research_summary?.processing_time_seconds || 0) }}
            </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Research Response -->
          <div class="mb-8">
            <div class="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 border-2 border-slate-200">
              <div v-html="marked(researchResult.response || '')" class="prose prose-slate max-w-none"></div>
            </div>
          </div>

          <!-- Sources Used -->
          <div v-if="researchResult.sources && researchResult.sources.length > 0" class="mb-8">
            <h4 class="text-lg font-bold text-slate-900 mb-4">Sources Used</h4>
            <div class="grid gap-3">
              <div
                  v-for="source in researchResult.sources"
                  :key="source.url"
                  class="flex items-center justify-between p-5 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-[#7786ec]/30 hover:bg-slate-100/50 transition-all duration-200"
              >
                <div class="flex-1">
                  <h5 class="font-semibold text-slate-900 mb-1">{{ source.title }}</h5>
                  <p class="text-sm text-slate-600">{{ source.domain }}</p>
                </div>
                <div class="flex items-center space-x-3">
            <span class="px-3 py-1.5 bg-[#7786ec]/10 text-[#7786ec] text-xs font-semibold rounded-full border border-[#7786ec]/20">
              Score: {{ Math.round(source.relevance_score || 0) }}
            </span>

                  <a :href="source.url"
                  target="_blank"
                  class="text-[#7786ec] hover:text-[#5a6fd8] transition-colors"
                  >
                  <Globe2 class="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Processing Summary -->
          <div v-if="researchResult.research_summary" class="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 border-2 border-slate-200">
            <h4 class="font-bold text-slate-900 mb-4">Processing Summary</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-white rounded-xl p-4 border border-slate-200">
                <div class="text-2xl font-bold text-[#7786ec] mb-1">{{ researchResult.research_summary.total_sources_found }}</div>
                <div class="text-xs text-slate-600 font-medium">Sources Found</div>
              </div>
              <div class="bg-white rounded-xl p-4 border border-slate-200">
                <div class="text-2xl font-bold text-[#7786ec] mb-1">{{ researchResult.research_summary.total_sources_processed }}</div>
                <div class="text-xs text-slate-600 font-medium">Processed</div>
              </div>
              <div class="bg-white rounded-xl p-4 border border-slate-200">
                <div class="text-2xl font-bold text-[#7786ec] mb-1">{{ researchResult.research_summary.total_chunks_created }}</div>
                <div class="text-xs text-slate-600 font-medium">Chunks Created</div>
              </div>
              <div class="bg-white rounded-xl p-4 border border-slate-200">
                <div class="text-2xl font-bold text-[#7786ec] mb-1">{{ formatResearchTime(researchResult.research_summary.processing_time_seconds) }}</div>
                <div class="text-xs text-slate-600 font-medium">Processing Time</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Research History -->
        <div v-if="researchHistory.length > 0" class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-200">
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <History class="w-6 h-6 text-slate-600" />
            </div>
            <h3 class="text-xl font-bold text-slate-900">Recent Research</h3>
          </div>

          <div class="space-y-3">
            <div
                v-for="session in researchHistory.slice(0, 5)"
                :key="session.query + session.latest_research"
                class="p-5 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-[#7786ec]/30 hover:bg-slate-100/50 transition-all duration-200"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-slate-900">{{ session.query }}</h4>
                <div class="flex items-center space-x-2 text-sm text-slate-500">
            <span class="px-2.5 py-1 bg-[#7786ec]/10 text-[#7786ec] rounded-full text-xs font-semibold border border-[#7786ec]/20">
              {{ session.sources?.length || 0 }} sources
            </span>
                  <span>•</span>
                  <span>{{ new Date(session.latest_research).toLocaleDateString() }}</span>
                </div>
              </div>
              <div v-if="session.sources" class="flex flex-wrap gap-2">
          <span
              v-for="source in session.sources.slice(0, 3)"
              :key="source.id"
              class="px-3 py-1 bg-white text-slate-700 text-xs font-medium rounded-full border border-slate-200"
          >
            {{ source.domain }}
          </span>
                <span
                    v-if="session.sources.length > 3"
                    class="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-semibold rounded-full"
                >
            +{{ session.sources.length - 3 }} more
          </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Generate Tab -->
      <div v-if="activeTab === 'generate'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">RAG Generation</h2>
                <p class="text-sm text-slate-500 mt-0.5">Ask questions and get AI-powered answers from your documents</p>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center gap-4">
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">{{ documents.length }} Documents</span>
              </div>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-xs font-semibold text-[#7786ec]">Context-Aware</span>
              </div>
            </div>
          </div>

          <!-- Generation Area -->
          <div class="relative border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300 group">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
            </div>

            <div class="space-y-6 max-w-3xl mx-auto">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Your Question</label>
                <textarea
                    v-model="generateQuery"
                    placeholder="Enter your question... (e.g., 'What are the key findings about AI safety?')"
                    class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400 resize-none"
                    rows="4"
                ></textarea>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 items-center">
                <div class="flex-1 w-full sm:w-auto">
                  <label class="block text-sm font-semibold text-slate-700 mb-3">Context Limit</label>
                  <input
                      v-model="generateLimit"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Sources"
                      class="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 text-center"
                  />
                </div>

                <div class="flex justify-center pt-0 sm:pt-8 w-full sm:w-auto">
                  <button
                      @click="generateResponse"
                      :disabled="!generateQuery || generating"
                      class="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    <svg v-if="generating" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    {{ generating ? 'Generating...' : 'Generate Response' }}
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap justify-center gap-2 pt-2">
          <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            RAG Technology
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Context-Aware
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            Source Attribution
          </span>
                <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
            AI-Generated
          </span>
              </div>
            </div>
          </div>

          <!-- Generation Result -->
          <div v-if="generationResult" class="mt-8">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <h3 class="text-xl font-bold text-slate-900">
                Generated Response
              </h3>
              <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                <span class="text-sm font-semibold text-[#7786ec]">{{ generationResult.sources.length }} Sources Used</span>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-lg transition-all duration-300">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-full flex items-center justify-center shadow-md">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">AI-Generated Answer</h3>
                </div>
                <div class="bg-white rounded-xl p-4 border border-slate-200">
                  <p class="text-slate-800 leading-relaxed">{{ generationResult.response }}</p>
                </div>
              </div>

              <div>
                <h4 class="text-lg font-semibold text-slate-900 mb-4">Sources Used</h4>
                <div class="grid gap-4">
                  <div
                      v-for="source in generationResult.sources"
                      :key="source.filename"
                      class="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-lg transition-all duration-300"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md">
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div>
                          <span class="font-bold text-slate-900 text-lg">{{ source.filename }}</span>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2">
                  <span class="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
                    Score: {{ source.score.toFixed(4) }}
                  </span>
                      </div>
                    </div>

                    <div class="bg-white rounded-xl p-4 border border-slate-200">
                      <p class="text-slate-700 leading-relaxed">{{ source.text_preview }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation Tab -->
      <div v-if="activeTab === 'conversation'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">RAG Chat</h2>
                <p class="text-sm text-slate-500 mt-0.5">Have a natural conversation with your knowledge base</p>
              </div>
            </div>

            <!-- Quick Stats & Actions -->
            <div class="flex items-center gap-3">
              <div v-if="conversationStarted" class="hidden lg:flex items-center gap-3">
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-xs font-semibold text-[#7786ec]">{{ conversationMessages.length }} Messages</span>
                </div>
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-xs font-semibold text-[#7786ec]">Real-Time</span>
                </div>
              </div>

              <button
                  v-if="conversationStarted"
                  @click="clearConversation"
                  class="inline-flex items-center px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200 border border-slate-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear Chat
              </button>

              <button
                  v-if="!conversationStarted"
                  @click="startConversation"
                  class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-full hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Start Conversation
              </button>
            </div>
          </div>

          <!-- Chat Container -->
          <div v-if="conversationStarted" class="space-y-6">
            <!-- Messages Area -->
            <div class="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 h-[500px] overflow-y-auto space-y-4 border-2 border-slate-200">
              <div v-if="conversationMessages.length === 0" class="flex items-center justify-center h-full">
                <div class="text-center">
                  <div class="w-20 h-20 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 mb-2">Ready to chat!</h3>
                  <p class="text-slate-600 max-w-md mx-auto">Ask me anything about your uploaded documents and scraped content.</p>
                  <div class="flex flex-wrap justify-center gap-2 mt-6">
              <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
                Context-Aware
              </span>
                    <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
                Source Attribution
              </span>
                    <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
                Multi-Turn Dialog
              </span>
                  </div>
                </div>
              </div>

              <!-- Messages -->
              <div
                  v-for="(message, index) in conversationMessages"
                  :key="index"
                  :class="[
            'flex animate-fadeIn',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
              >
                <div
                    :class="[
              'max-w-xs lg:max-w-xl px-5 py-3.5 rounded-2xl shadow-md',
              message.role === 'user'
                ? 'bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white'
                : message.role === 'error'
                ? 'bg-red-50 text-red-800 border-2 border-red-200'
                : 'bg-white text-slate-900 border-2 border-slate-200'
            ]"
                >
                  <!-- User and Error Messages (plain text) -->
                  <p v-if="message.role === 'user' || message.role === 'error'" class="text-sm leading-relaxed">
                    {{ message.content }}
                  </p>

                  <!-- Assistant Messages (with markdown support) -->
                  <div
                      v-else-if="message.role === 'assistant'"
                      class="text-sm leading-relaxed markdown-content"
                      v-html="renderMarkdown(message.content)"
                  ></div>

                  <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/30 text-xs">
              <span :class="message.role === 'user' ? 'text-white/80' : 'text-slate-500'">
                {{ formatTime(message.timestamp) }}
              </span>
                    <div v-if="message.ragInfo && message.role === 'assistant'" class="flex items-center space-x-2">
                <span
                    :class="[
                    'px-2.5 py-1 rounded-full text-xs font-semibold',
                    message.ragInfo.hasRelevantContext
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  ]"
                >
                  <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  {{ message.ragInfo.hasRelevantContext ? `${message.ragInfo.totalSources} sources` : 'No sources' }}
                </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading indicator -->
              <div v-if="sendingMessage" class="flex justify-start animate-fadeIn">
                <div class="bg-white text-slate-900 border-2 border-slate-200 max-w-xs lg:max-w-xl px-5 py-3.5 rounded-2xl shadow-md">
                  <div class="flex items-center space-x-3">
                    <div class="flex space-x-1">
                      <div class="w-2.5 h-2.5 bg-[#7786ec] rounded-full animate-bounce"></div>
                      <div class="w-2.5 h-2.5 bg-[#7786ec] rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                      <div class="w-2.5 h-2.5 bg-[#7786ec] rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-sm text-slate-600 font-medium">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Input -->
            <div class="flex space-x-3">
              <div class="flex-1 relative">
                <input
                    v-model="currentMessage"
                    type="text"
                    placeholder="Ask me anything about your documents..."
                    class="w-full px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7786ec] focus:border-[#7786ec] transition-all duration-200 text-slate-900 placeholder-slate-400 pr-12"
                    @keyup.enter="sendMessage"
                    :disabled="sendingMessage"
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd class="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">Enter</kbd>
                </div>
              </div>
              <button
                  @click="sendMessage"
                  :disabled="!currentMessage.trim() || sendingMessage"
                  class="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-[#7786ec] to-[#5a6fd8] text-white font-semibold rounded-xl hover:from-[#6675db] hover:to-[#4a5fc8] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                <svg v-if="sendingMessage" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Welcome State -->
          <div v-else class="relative border-2 border-dashed border-slate-300 rounded-2xl p-16 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300">
            <div class="text-center">
              <div class="w-20 h-20 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <div class="space-y-3 max-w-xl mx-auto">
                <h3 class="text-2xl font-bold text-slate-900">Start a RAG Conversation</h3>
                <p class="text-slate-600 leading-relaxed">
                  Have a natural conversation with your knowledge base. The AI will use information from your uploaded documents and scraped content to provide accurate, context-aware responses.
                </p>
                <div class="flex flex-wrap justify-center gap-2 pt-4">
            <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Multi-Turn Dialog
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Context Retention
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Source Citations
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Real-Time Responses
            </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Tab -->
      <div v-if="activeTab === 'documents'" class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <div>
                <h2 class="text-2xl font-bold text-black">Document Management</h2>
                <p class="text-sm text-slate-500 mt-0.5">View and manage your knowledge base documents</p>
              </div>
            </div>

            <!-- Quick Stats & Actions -->
            <div class="flex items-center gap-3">
              <div v-if="documents.length > 0" class="hidden lg:flex items-center gap-3">
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-xs font-semibold text-[#7786ec]">{{ documents.length }} Documents</span>
                </div>
                <div class="px-4 py-2 bg-[#7786ec]/10 rounded-full border border-[#7786ec]/30">
                  <span class="text-xs font-semibold text-[#7786ec]">{{ documents.reduce((sum, doc) => sum + doc.chunk_count, 0) }} Chunks</span>
                </div>
              </div>

              <button
                  @click="fetchDocuments"
                  :disabled="fetchingDocuments"
                  class="inline-flex items-center px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200 disabled:opacity-50 border border-slate-200"
              >
                <svg
                    :class="['w-5 h-5 mr-2', fetchingDocuments ? 'animate-spin' : '']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ fetchingDocuments ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>

          <div v-if="documents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="doc in documents"
                :key="doc.id"
                class="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-[#7786ec] hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-[#7786ec] to-[#5a6fd8] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>

                <button
                    @click="deleteDocument(doc.id)"
                    :disabled="deletingDocument === doc.id"
                    class="inline-flex items-center justify-center w-9 h-9 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
                    title="Delete document"
                >
                  <svg v-if="deletingDocument === doc.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>

              <div class="flex-1">
                <h4 class="text-lg font-bold text-slate-900 mb-1 line-clamp-2" :title="doc.filename">{{ doc.filename }}</h4>
                <p class="text-xs text-slate-500 mb-4">ID: {{ doc.id }}</p>

                <div class="space-y-2">
                  <div class="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
              <span class="text-xs font-medium text-slate-600 flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-[#7786ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Chunks
              </span>
                    <span class="text-sm font-bold text-[#7786ec]">{{ doc.chunk_count }}</span>
                  </div>

                  <div class="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
              <span class="text-xs font-medium text-slate-600 flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Created
              </span>
                    <span class="text-sm font-semibold text-slate-700">{{ formatDate(doc.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="relative border-2 border-dashed border-slate-300 rounded-2xl p-16 hover:border-[#7786ec] hover:bg-[#7786ec]/5 transition-all duration-300">
            <div class="text-center">
              <div class="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="space-y-3 max-w-xl mx-auto">
                <h3 class="text-2xl font-bold text-slate-900">No documents found</h3>
                <p class="text-slate-600 leading-relaxed">
                  Upload some documents or scrape websites in the <span class="font-semibold text-[#7786ec]">Upload</span> tab to get started building your knowledge base!
                </p>
                <div class="flex flex-wrap justify-center gap-2 pt-4">
            <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              PDF Support
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              TXT Support
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Web Scraping
            </span>
                  <span class="px-3 py-1 bg-[#7786ec]/10 text-[#7786ec] text-xs font-medium rounded-full border border-[#7786ec]/20">
              Auto-Chunking
            </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Error Toast -->
    <div v-if="error" class="fixed top-6 right-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-slideIn border-2 border-red-400 max-w-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm">Error</p>
            <p class="text-sm opacity-95">{{ error }}</p>
          </div>
        </div>
        <button
            @click="error = null"
            class="ml-4 text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import {ref, onMounted, watch, reactive} from 'vue'
import { marked } from 'marked'
import {
  Upload,
  Search,
  Sparkles,
  MessageSquareText,
  FileText,
  Globe,
  MessageSquare,
  Layers,
  Folder,
  Rocket,
  Boxes,
  Link,
  Brain,
  icons,
  Zap, Settings, History, Target, Globe2, BookOpen,
} from 'lucide-vue-next'


export default {
  name: 'RAGPlatform',
  methods: {marked},
  computed: {
    icons() {
      return icons
    }
  },
  components: {Zap,MessageSquareText , Settings, History, Target, Globe2, BookOpen,Layers,Brain, MessageSquare, FileText, Globe, Search, Sparkles, Upload, Folder, Rocket, Boxes, Link},
  setup() {
    // State management
    const activeTab = ref('upload')
    const backendStatus = ref('Checking...')
    const error = ref(null)

    // Upload state
    const selectedFile = ref(null)
    const uploading = ref(false)
    const uploadProgress = ref(0)
    const uploadResult = ref(null)

    // Scrape state
    const scrapeUrl = ref('')
    const scrapeMethod = ref('auto')
    const processImmediately = ref(true)
    const scraping = ref(false)
    const scrapeResult = ref(null)

    // Search state
    const searchQuery = ref('')
    const searchLimit = ref(5)
    const searching = ref(false)
    const searchResults = ref(null)

    // Generate state
    const generateQuery = ref('')
    const generateLimit = ref(3)
    const generating = ref(false)
    const generationResult = ref(null)

    // Documents state
    const documents = ref([])
    const fetchingDocuments = ref(false)
    const deletingDocument = ref(null)

    // 3. Add conversation state in setup()
    const conversationSessionId = ref(null)
    const conversationMessages = ref([])
    const currentMessage = ref('')
    const sendingMessage = ref(false)
    const conversationStarted = ref(false)

    // Add these state variables to your setup() function
    const activeClusteringTab = ref('cluster')

// Clustering state
    const clusteringMethod = ref('hierarchical')
    const forceReclustering = ref(false)
    const clustering = ref(false)
    const clusteringResult = ref(null)

// Clusters state
    const clusters = ref([])
    const fetchingClusters = ref(false)
    const expandedCluster = ref(null)
    const clusterDocuments = ref([])

// Clustered search state
    const clusteredSearchQuery = ref('')
    const selectedClusterForSearch = ref('')
    const clusteredSearchLimit = ref(5)
    const clusteredSearching = ref(false)
    const clusteredSearchResults = ref(null)

// Similar documents state
    const selectedDocumentForSimilarity = ref('')
    const similarityLimit = ref(5)
    const findingSimilar = ref(false)
    const similarDocuments = ref(null)
    const enhancedDocuments = ref([])

// Clustering sub-tabs configuration
    const clusteringTabs = [
      { id: 'cluster', label: 'Cluster Now', icon: 'Rocket' },
      { id: 'clusters', label: 'View Clusters', icon: 'Boxes' },
      { id: 'search', label: 'Clustered Search', icon: 'Search' },
      { id: 'similar', label: 'Similar Documents', icon: 'Link' },
      { id: 'rag', label: 'RAG Generation', icon: 'Brain' }
    ];

// RAG States
    const ragQuery = ref('')
    const ragResponse = ref('')
    const ragLoading = ref(false)
    const ragMethod = ref('auto') // 'auto' or 'explicit'
    const selectedClusterId = ref(null)


    const ragConfig = reactive({
      max_clusters: 2,
      context_limit: 3,
      include_cluster_info: true,
      temperature: 0.7
    })

    const ragHistory = ref([])
    const availableClusters = ref([])
    const ragResult = ref(null)
    const ragError = ref(null)
    const showAdvancedRAGSettings = ref(false);

    const toggleAdvancedRAGSettings = () => {
      showAdvancedRAGSettings.value = !showAdvancedRAGSettings.value;
    };

// Configure marked options for better security
    marked.setOptions({
      breaks: true,
      gfm: true, // GitHub Flavored Markdown
      sanitize: false, // We'll handle sanitization if needed
      tables: true
    })

    // Configuration
    const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001'
    // Tab configuration
    const tabs = [
      {
        id: 'upload',
        label: 'Upload',
        icon: Upload
      },
      {
        id: 'scrape',
        label: 'Scrape',
        icon: Globe
      },
      {
        id: 'search',
        label: 'Search',
        icon: Search
      },
      {
        id: 'generate',
        label: 'Generate',
        icon: MessageSquareText
      },
      {
        id: 'conversation',
        label: 'Chat',
        icon: MessageSquare
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: FileText
      },
      {
        id: 'clustering',
        label: 'Clustering',
        icon: Layers
      },
      { id: 'research', label: 'Auto Research', icon: 'BookOpen' },


    ]

    // API helper function
    const apiRequest = async (endpoint, options = {}) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        throw new Error(`API request failed: ${err.message}`)
      }
    }

    // Backend status check
    const checkBackendStatus = async () => {
      try {
        await apiRequest('/stat')
        backendStatus.value = 'Online'
      } catch (err) {
        backendStatus.value = 'Offline'
        error.value = 'Backend is not responding. Please check if the server is running.'
      }
    }
// Trigger clustering
    const triggerClustering = async () => {
      clustering.value = true
      clusteringResult.value = null
      error.value = null

      try {
        const result = await apiRequest('/cluster-documents', {
          method: 'POST',
          body: JSON.stringify({
            method: clusteringMethod.value,
            force: forceReclustering.value
          }),
        })

        clusteringResult.value = result

        // Refresh clusters after successful clustering
        await fetchClusters()
      } catch (err) {
        error.value = err.message
      } finally {
        clustering.value = false
      }
    }

// Fetch all clusters
    const fetchClusters = async () => {
      fetchingClusters.value = true
      error.value = null

      try {
        const result = await apiRequest('/clusters')
        clusters.value = result.clusters || []
      } catch (err) {
        error.value = err.message
      } finally {
        fetchingClusters.value = false
      }
    }

// View documents in a cluster
    const viewClusterDocuments = async (clusterId) => {
      if (expandedCluster.value === clusterId) {
        expandedCluster.value = null
        clusterDocuments.value = []
        return
      }

      try {
        const result = await apiRequest(`/clusters/${clusterId}/documents`)
        clusterDocuments.value = result.documents || []
        expandedCluster.value = clusterId
      } catch (err) {
        error.value = err.message
      }
    }

// Perform clustered search
    const performClusteredSearch = async () => {
      if (!clusteredSearchQuery.value.trim()) return

      clusteredSearching.value = true
      error.value = null

      try {
        const payload = {
          query: clusteredSearchQuery.value,
          limit: parseInt(clusteredSearchLimit.value),
        }

        if (selectedClusterForSearch.value) {
          payload.cluster_id = selectedClusterForSearch.value
        }

        const result = await apiRequest('/search-clustered', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        clusteredSearchResults.value = result
      } catch (err) {
        error.value = err.message
      } finally {
        clusteredSearching.value = false
      }
    }

// Find similar documents
    const findSimilarDocuments = async () => {
      if (!selectedDocumentForSimilarity.value) return

      findingSimilar.value = true
      error.value = null

      try {
        const result = await apiRequest('/similar-documents', {
          method: 'POST',
          body: JSON.stringify({
            document_id: selectedDocumentForSimilarity.value,
            limit: parseInt(similarityLimit.value),
          }),
        })

        similarDocuments.value = result.similar_documents || []
      } catch (err) {
        error.value = err.message
      } finally {
        findingSimilar.value = false
      }
    }

// Fetch enhanced documents for similarity search
    const fetchEnhancedDocuments = async () => {
      try {
        const result = await apiRequest('/documents-enhanced')
        console.log('Full API response:', result)

        // Extract documents from clusters
        const documents = []
        if (result.clusters && Array.isArray(result.clusters)) {
          result.clusters.forEach(cluster => {
            if (cluster.documents && Array.isArray(cluster.documents)) {
              // Add cluster_name to each document for display
              cluster.documents.forEach(doc => {
                documents.push({
                  ...doc,
                  cluster_name: cluster.name || cluster.cluster_name || 'Unknown Cluster'
                })
              })
            }
          })
        }

        console.log('Extracted documents:', documents)
        enhancedDocuments.value = documents
      } catch (err) {
        console.error('Error fetching enhanced documents:', err)
        error.value = err.message
      }
    }
    watch(activeClusteringTab, (newTab) => {
      if (newTab === 'similar') {
        fetchEnhancedDocuments()
      }
    })

// Initialize clustering data on component mount
    const initializeClusteringData = async () => {
      await Promise.all([
        fetchClusters(),
        fetchEnhancedDocuments()
      ])
    }

// Watch for tab changes to initialize data
    watch(activeTab, (newTab) => {
      if (newTab === 'clustering') {
        initializeClusteringData()
      }
    })

    // File handling
    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0]
      uploadResult.value = null
      error.value = null
    }

    // Upload document
    const uploadDocument = async () => {
      if (!selectedFile.value) return

      uploading.value = true
      uploadProgress.value = 0
      error.value = null

      try {
        const formData = new FormData()
        formData.append('document', selectedFile.value)

        // Simulate progress
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 10
          }
        }, 500)

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        uploadProgress.value = 100

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`)
        }

        const result = await response.json()
        uploadResult.value = result
        selectedFile.value = null

        // Refresh documents list
        await fetchDocuments()

      } catch (err) {
        error.value = err.message
      } finally {
        uploading.value = false
        setTimeout(() => {
          uploadProgress.value = 0
        }, 2000)
      }
    }

    // Scrape website
    const scrapeWebsite = async () => {
      if (!scrapeUrl.value.trim()) return

      scraping.value = true
      scrapeResult.value = null
      error.value = null

      try {
        const result = await apiRequest('/scrape', {
          method: 'POST',
          body: JSON.stringify({
            url: scrapeUrl.value,
            method: scrapeMethod.value,
            process_immediately: processImmediately.value
          }),
        })

        scrapeResult.value = result
        if (processImmediately.value) {
          await fetchDocuments()
        }
      } catch (err) {
        error.value = err.message
      } finally {
        scraping.value = false
      }
    }

    // Search functionality
    const performSearch = async () => {
      if (!searchQuery.value.trim()) return

      searching.value = true
      error.value = null

      try {
        const result = await apiRequest('/search', {
          method: 'POST',
          body: JSON.stringify({
            query: searchQuery.value,
            limit: parseInt(searchLimit.value),
          }),
        })

        searchResults.value = result
      } catch (err) {
        error.value = err.message
      } finally {
        searching.value = false
      }
    }

    // Generate response
    const generateResponse = async () => {
      if (!generateQuery.value.trim()) return

      generating.value = true
      error.value = null

      try {
        const result = await apiRequest('/generate', {
          method: 'POST',
          body: JSON.stringify({
            query: generateQuery.value,
            limit: parseInt(generateLimit.value),
          }),
        })

        generationResult.value = result
      } catch (err) {
        error.value = err.message
      } finally {
        generating.value = false
      }
    }

    // Fetch documents
    const fetchDocuments = async () => {
      fetchingDocuments.value = true
      error.value = null

      try {
        const result = await apiRequest('/documents')
        documents.value = result.documents || []
      } catch (err) {
        error.value = err.message
      } finally {
        fetchingDocuments.value = false
      }
    }

    // Delete document
    const deleteDocument = async (id) => {
      if (!confirm('Are you sure you want to delete this document?')) return

      deletingDocument.value = id
      error.value = null

      try {
        await apiRequest(`/documents/${id}`, {
          method: 'DELETE',
        })

        // Remove from local list
        documents.value = documents.value.filter(doc => doc.id !== id)
      } catch (err) {
        error.value = err.message
      } finally {
        deletingDocument.value = null
      }
    }

    // 4. Add conversation methods in setup()
    const startConversation = async () => {
      try {
        const response = await apiRequest('/conversation/start', {
          method: 'POST',
          body: JSON.stringify({})
        })

        if (response.success) {
          conversationSessionId.value = response.sessionId
          conversationMessages.value = []
          conversationStarted.value = true
        }
      } catch (err) {
        error.value = `Failed to start conversation: ${err.message}`
      }
    }

    const sendMessage = async () => {
      if (!currentMessage.value.trim() || sendingMessage.value) return

      const userMessage = currentMessage.value.trim()

      // Add user message to UI
      conversationMessages.value.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      })

      currentMessage.value = ''
      sendingMessage.value = true

      try {
        const response = await apiRequest('/conversation/message', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: conversationSessionId.value,
            message: userMessage,
            contextLimit: 5,
            minRelevanceScore: 0.3
          })
        })

        if (response.success) {
          // Add assistant response to UI
          conversationMessages.value.push({
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
            ragInfo: response.ragInfo
          })
        }
      } catch (err) {
        error.value = `Failed to send message: ${err.message}`
        // Add error message to conversation
        conversationMessages.value.push({
          role: 'error',
          content: `Error: ${err.message}`,
          timestamp: new Date()
        })
      } finally {
        sendingMessage.value = false
      }
    }

    const clearConversation = async () => {
      if (!conversationSessionId.value) return

      try {
        await apiRequest(`/conversation/${conversationSessionId.value}/clear`, {
          method: 'POST',
          body: JSON.stringify({})
        })

        conversationMessages.value = []
      } catch (err) {
        error.value = `Failed to clear conversation: ${err.message}`
      }
    }

    // Markdown parsing function
    const renderMarkdown = (text) => {
      if (!text) return ''

      try {
        return marked.parse(text)
      } catch (error) {
        console.error('Markdown parsing error:', error)
        // Fallback to plain text if parsing fails
        return text.replace(/\n/g, '<br>')
      }
    }

    const formatTime = (date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }


    // Utility functions
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString()
    }

    /////////////////////
    // Load available clusters
    const loadClustersForRAG = async () => {
      try {
        const response = await apiRequest('/clusters')
        if (response.success) {
          availableClusters.value = response.clusters
        }
      } catch (error) {
        console.error('Failed to load clusters:', error)
        showNotification('Failed to load clusters', 'error')
      }
    }

// Load config
    const loadRAGConfig = async () => {
      try {
        const response = await apiRequest('/rag-config')
        if (response.success) {
          Object.assign(ragConfig, response.config)
        }
      } catch (error) {
        console.error('Failed to load RAG config:', error)
      }
    }

// Generate RAG response
    const generateRAGResponse = async () => {
      if (!ragQuery.value.trim()) {
        showNotification('Please enter a query', 'warning')
        return
      }

      ragLoading.value = true
      ragError.value = null
      ragResult.value = null

      const requestBody = {
        query: ragQuery.value,
        max_clusters: ragConfig.max_clusters,
        context_limit: ragConfig.context_limit,
        include_cluster_info: ragConfig.include_cluster_info,
        temperature: ragConfig.temperature
      }

      if (ragMethod.value === 'explicit' && selectedClusterId.value) {
        requestBody.cluster_id = selectedClusterId.value
      }

      try {
        const response = await apiRequest('/rag', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })

        if (response.success) {
          ragResult.value = response
          ragResponse.value = response.response

          ragHistory.value.unshift({
            id: Date.now(),
            query: ragQuery.value,
            response: response.response,
            method: response.method,
            clusters_used: response.clusters_searched?.length || 0,
            timestamp: new Date().toLocaleString(),
            sources: response.sources || []
          })

          if (ragHistory.value.length > 10) {
            ragHistory.value = ragHistory.value.slice(0, 10)
          }

          showNotification('RAG response generated successfully!', 'success')
        } else {
          ragError.value = response.error || 'Failed to generate response'
          showNotification('Failed to generate RAG response', 'error')
        }
      } catch (error) {
        console.error('RAG generation error:', error)
        ragError.value = error.message
        showNotification('Error generating RAG response', 'error')
      } finally {
        ragLoading.value = false
      }
    }

// Copy response
    const copyRAGResponse = async () => {
      try {
        await navigator.clipboard.writeText(ragResponse.value)
        showNotification('Response copied to clipboard!', 'success')
      } catch (error) {
        console.error('Failed to copy:', error)
        showNotification('Failed to copy response', 'error')
      }
    }

// Clear session
    const clearRAGSession = () => {
      ragQuery.value = ''
      ragResponse.value = ''
      ragResult.value = null
      ragError.value = null
      ragHistory.value = []
    }

// Update config
    const updateRAGConfig = async () => {
      try {
        const response = await apiRequest('/rag-config', {
          method: 'PUT',
          body: JSON.stringify(ragConfig)
        })

        if (response.success) {
          showNotification('RAG configuration updated!', 'success')
        }
      } catch (error) {
        console.error('Failed to update RAG config:', error)
        showNotification('Failed to update configuration', 'error')
      }
    }

// Batch processing
    const processBatchRAG = async () => {
      const queries = ragQuery.value.split('\n').filter(q => q.trim())

      if (queries.length === 0) {
        showNotification('Please enter queries (one per line)', 'warning')
        return
      }

      if (queries.length > 10) {
        showNotification('Maximum 10 queries allowed', 'warning')
        return
      }

      ragLoading.value = true

      try {
        const requestBody = {
          queries,
          max_clusters: ragConfig.max_clusters
        }

        if (ragMethod.value === 'explicit' && selectedClusterId.value) {
          requestBody.cluster_id = selectedClusterId.value
        }

        const response = await apiRequest('/rag-batch', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })

        if (response.success) {
          const batchResults = response.results.map(result => ({
            id: Date.now() + Math.random(),
            query: result.query,
            response: result.response || result.error,
            success: result.success,
            timestamp: new Date().toLocaleString(),
            clusters_used: result.clusters_used || 0
          }))

          ragHistory.value.unshift(...batchResults)
          showNotification(`Processed ${queries.length} queries successfully!`, 'success')
        }
      } catch (error) {
        console.error('Batch RAG error:', error)
        showNotification('Error processing batch queries', 'error')
      } finally {
        ragLoading.value = false
      }
    }
    function showNotification(msg, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${msg}`)
    }
// Watch for RAG tab
    watch(activeClusteringTab, (newTab) => {
      if (newTab === 'rag') {
        loadClustersForRAG()
        loadRAGConfig()
      }
    })
    const researchQuery = ref('')
    const researchMaxSources = ref(3)
    const researching = ref(false)
    const researchResult = ref(null)
    const researchMode = ref('auto') // 'auto', 'quick', 'custom'

// Research configuration
    const researchConfig = reactive({
      search_params: {
        results_per_term: 8,
        country: 'us',
        language: 'en'
      },
      user_preferences: {
        preferred_domains: [],
        excluded_domains: []
      },
      response_options: {
        response_style: 'comprehensive' // 'comprehensive', 'concise', 'bullet-points'
      }
    })

// Custom sources state
    const customSources = ref([''])
    const researchHistory = ref([])
    const fetchingResearchHistory = ref(false)

// Add these functions to your methods or setup()
    const performAutoResearch = async () => {
      if (!researchQuery.value.trim()) {
        error.value = 'Please enter a research query'
        return
      }

      researching.value = true
      error.value = null
      researchResult.value = null

      try {
        const requestBody = {
          query: researchQuery.value,
          max_sources: researchMaxSources.value,
          search_params: researchConfig.search_params,
          user_preferences: researchConfig.user_preferences,
          response_options: researchConfig.response_options
        }

        const endpoint = researchMode.value === 'quick' ? '/research/quick' : '/research'

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        const data = await response.json()

        if (data.success) {
          researchResult.value = data
          // Add to history
          researchHistory.value.unshift({
            query: researchQuery.value,
            timestamp: new Date().toISOString(),
            sources_count: data.research_summary.total_sources_processed,
            processing_time: data.research_summary.processing_time_seconds
          })
        } else {
          error.value = data.message || 'Research failed'
        }
      } catch (err) {
        error.value = 'Failed to perform research: ' + err.message
      } finally {
        researching.value = false
      }
    }

    const performCustomSourceResearch = async () => {
      const validUrls = customSources.value.filter(url => url.trim())

      if (!researchQuery.value.trim() || validUrls.length === 0) {
        error.value = 'Please enter a query and at least one valid URL'
        return
      }

      researching.value = true
      error.value = null

      try {
        const response = await fetch(`${API_BASE_URL}/research/custom-sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: researchQuery.value,
            custom_urls: validUrls
          })
        })

        const data = await response.json()

        if (data.success) {
          researchResult.value = data
        } else {
          error.value = data.message || 'Custom source research failed'
        }
      } catch (err) {
        error.value = 'Failed to research custom sources: ' + err.message
      } finally {
        researching.value = false
      }
    }

    const fetchResearchHistory = async () => {
      fetchingResearchHistory.value = true

      try {
        const response = await fetch(`${API_BASE_URL}/research/history?limit=20`)
        const data = await response.json()

        if (data.success) {
          researchHistory.value = data.research_sessions
        }
      } catch (err) {
        error.value = 'Failed to fetch research history'
      } finally {
        fetchingResearchHistory.value = false
      }
    }

    const addCustomSource = () => {
      customSources.value.push('')
    }

    const removeCustomSource = (index) => {
      customSources.value.splice(index, 1)
    }

    const clearResearchResults = () => {
      researchResult.value = null
      error.value = null
    }

    const formatResearchTime = (seconds) => {
      return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    }

    // Initialize
    onMounted(async () => {
      await checkBackendStatus()
      await fetchDocuments()
      await fetchResearchHistory()
    })

    return {
      // State
      activeTab,
      backendStatus,
      error,
      tabs,

      // Upload
      selectedFile,
      uploading,
      uploadProgress,
      uploadResult,
      handleFileSelect,
      uploadDocument,

      // Scrape
      scrapeUrl,
      scrapeMethod,
      processImmediately,
      scraping,
      scrapeResult,
      scrapeWebsite,

      // Search
      searchQuery,
      searchLimit,
      searching,
      searchResults,
      performSearch,

      // Generate
      generateQuery,
      generateLimit,
      generating,
      generationResult,
      generateResponse,

      // Documents
      documents,
      fetchingDocuments,
      deletingDocument,
      fetchDocuments,
      deleteDocument,
      // Conversation
      conversationSessionId,
      conversationMessages,
      currentMessage,
      sendingMessage,
      conversationStarted,
      startConversation,
      sendMessage,
      clearConversation,
      formatTime,
      //Markdown
      renderMarkdown,
      // Utils
      formatDate,

      // Clustering tab states
      activeClusteringTab,
      clusteringMethod,
      forceReclustering,
      clustering,
      clusteringResult,

      // Clusters states
      clusters,
      fetchingClusters,
      expandedCluster,
      clusterDocuments,

      // Clustered search states
      clusteredSearchQuery,
      selectedClusterForSearch,
      clusteredSearchLimit,
      clusteredSearching,
      clusteredSearchResults,

      // Similar documents states
      selectedDocumentForSimilarity,
      similarityLimit,
      findingSimilar,
      similarDocuments,
      enhancedDocuments,

      // Configuration
      clusteringTabs,

      // Methods
      triggerClustering,
      fetchClusters,
      viewClusterDocuments,
      performClusteredSearch,
      findSimilarDocuments,
      fetchEnhancedDocuments,
      initializeClusteringData,
      // RAG states and methods
      ragQuery,
      ragResponse,
      ragLoading,
      ragMethod,
      selectedClusterId,
      ragConfig,
      ragHistory,
      ragResult,
      ragError,
      loadClustersForRAG,
      loadRAGConfig,
      generateRAGResponse,
      copyRAGResponse,
      clearRAGSession,
      updateRAGConfig,
      processBatchRAG,
      showAdvancedRAGSettings,
      toggleAdvancedRAGSettings,
      // Research variables
      researchQuery,
      researchMaxSources,
      researching,
      researchResult,
      researchMode,
      researchConfig,
      customSources,
      researchHistory,
      fetchingResearchHistory,

      // Research functions
      performAutoResearch,
      performCustomSourceResearch,
      fetchResearchHistory,
      addCustomSource,
      removeCustomSource,
      clearResearchResults,
      formatResearchTime
    }
  },
}
</script>

<style scoped>

/* Markdown content styling */
.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  font-weight: bold;
  margin: 0.5rem 0;
}

.markdown-content h1 { font-size: 1.25rem; }
.markdown-content h2 { font-size: 1.125rem; }
.markdown-content h3 { font-size: 1rem; }

.markdown-content p {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.markdown-content li {
  margin: 0.25rem 0;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.bgcolor {
  background: #7786ec;
}

.markdown-content th {
  background-color: #f9fafb;
  font-weight: 600;
}

.markdown-content tr:nth-child(even) {
  background-color: #f9fafb;
}

.markdown-content blockquote {
  border-left: 4px solid #10b981;
  padding-left: 1rem;
  margin: 0.5rem 0;
  font-style: italic;
  background-color: #f0fdf4;
}

.markdown-content code {
  background-color: #f1f5f9;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}

.markdown-content pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content a {
  color: #10b981;
  text-decoration: underline;
}

.markdown-content a:hover {
  color: #047857;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
</style>