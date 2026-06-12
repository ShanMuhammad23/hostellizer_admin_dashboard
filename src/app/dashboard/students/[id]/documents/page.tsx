"use client"
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LocalImageUpload } from '@/components/LocalImageUpload'
import { getUploadServeUrl } from '@/lib/upload-url'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  FileImage
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import axios from 'axios'

interface Document {
  id: string
  type: 'e-stamp' | 'cnic-front' | 'cnic-back' | 'parent-id-1' | 'parent-id-2'
  url: string
  uploadedAt: string
  status: 'verified' | 'pending' | 'rejected'
  fileName?: string
}

interface StudentDetails {
  id: string
  name: string
  email: string
  phone: string
  roomnumber: number
  status: string
}

const documentTypes = [
  {
    type: 'e-stamp' as const,
    title: 'E-Stamp',
    description: 'Official E-Stamp document',
    icon: FileText,
    required: true
  },
  {
    type: 'cnic-front' as const,
    title: 'CNIC Front',
    description: 'Front side of CNIC',
    icon: FileImage,
    required: true
  },
  {
    type: 'cnic-back' as const,
    title: 'CNIC Back',
    description: 'Back side of CNIC',
    icon: FileImage,
    required: true
  },
  {
    type: 'parent-id-1' as const,
    title: 'Parent ID Copy 1',
    description: 'First parent ID document',
    icon: FileImage,
    required: true
  },
  {
    type: 'parent-id-2' as const,
    title: 'Parent ID Copy 2',
    description: 'Second parent ID document',
    icon: FileImage,
    required: false
  }
]

export default function StudentDocuments({ params }: { params: { id: string } }) {
  const { id } = params
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<Document['type'] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  useEffect(() => {
    const fetchStudentAndDocuments = async () => {
      try {
        setLoading(true)
        
        // Fetch student details
        const studentResponse = await axios.get(`/api/students/${id}`)
        if (studentResponse.data.success) {
          setStudent(studentResponse.data.student)
        }

        // Fetch documents from API
        const documentsResponse = await axios.get(`/api/students/${id}/documents`)
        if (documentsResponse.data.success) {
          // Transform API response to match our Document interface
          const transformedDocuments: Document[] = documentsResponse.data.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.documentdata.type,
            url: doc.documentdata.url,
            uploadedAt: doc.documentdata.uploadedAt,
            status: doc.documentdata.status,
            fileName: doc.documentdata.fileName
          }))
          setDocuments(transformedDocuments)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to fetch student documents')
        toast.error('Failed to load documents')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentAndDocuments()
  }, [id])

  const handleUploadSuccess = async (url: string) => {
    if (!selectedDocumentType) return

    try {
      setUploading(true)
      
      // Upload document to API
      const response = await axios.post(`/api/students/${id}/documents`, {
        documentType: selectedDocumentType,
        imageUrl: url,
        fileName: `document-${selectedDocumentType}.jpg`,
        status: 'pending'
      })

      if (response.data.success) {
        // Transform API response to match our Document interface
        const newDocument: Document = {
          id: response.data.document.id,
          type: response.data.document.documentdata.type,
          url: response.data.document.documentdata.url,
          uploadedAt: response.data.document.documentdata.uploadedAt,
          status: response.data.document.documentdata.status,
          fileName: response.data.document.documentdata.fileName
        }

        // Update documents list
        setDocuments(prev => {
          // Remove existing document of same type if it exists
          const filtered = prev.filter(doc => doc.type !== selectedDocumentType)
          return [...filtered, newDocument]
        })

        setShowUploadDialog(false)
        setSelectedDocumentType(null)
        toast.success(response.data.message)
      } else {
        throw new Error(response.data.message || 'Failed to save document')
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to save document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Delete document via API
      const response = await axios.delete(`/api/students/${id}/documents?documentId=${documentId}`)
      
      if (response.data.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        toast.success('Document deleted successfully')
      } else {
        throw new Error(response.data.message || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const handlePreviewDocument = (document: Document) => {
    setPreviewDocument(document)
    setShowPreviewDialog(true)
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDocumentForType = (type: Document['type']) => {
    return documents.find(doc => doc.type === type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 px-2 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-white border rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/dashboard/students/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Student
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                {`${student?.name}'s  Documents`}
              </h1>
            
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {documentTypes.map((docType) => {
            const document = getDocumentForType(docType.type)
            const IconComponent = docType.icon

            return (
              <Card key={docType.type} className="relative bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{docType.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {docType.description}
                        </CardDescription>
                      </div>
                    </div>
                    {docType.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {document ? (
                    <div className="space-y-4">
                      {/* Document Preview */}
                      <div className="relative">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getUploadServeUrl(document.url)}
                            alt={docType.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          {getStatusIcon(document.status)}
                        </div>
                      </div>

                      {/* Document Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(document.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewDocument(document)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(getUploadServeUrl(document.url), '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        No document uploaded
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocumentType(docType.type)
                          setShowUploadDialog(true)
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            
            {selectedDocumentType && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <FileText className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-lg">
                    {documentTypes.find(dt => dt.type === selectedDocumentType)?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {documentTypes.find(dt => dt.type === selectedDocumentType)?.description}
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <LocalImageUpload
                    folder="documents"
                    label="Upload file"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    onUploadSuccess={handleUploadSuccess}
                  />
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Supported formats: JPG, PNG, PDF (Max 10MB)
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false)
                  setSelectedDocumentType(null)
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            
            {previewDocument && (
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={getUploadServeUrl(previewDocument.url)}
                    alt="Document preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2">
                      {documentTypes.find(dt => dt.type === previewDocument.type)?.title}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(previewDocument.status)}`}>
                      {previewDocument.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <span className="ml-2">
                      {new Date(previewDocument.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">File:</span>
                    <span className="ml-2">
                      {previewDocument.fileName || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
              >
                Close
              </Button>
              {previewDocument && (
                <Button
                  onClick={() => window.open(getUploadServeUrl(previewDocument.url), '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}