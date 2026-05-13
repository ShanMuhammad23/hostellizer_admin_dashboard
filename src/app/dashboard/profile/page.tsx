"use client"
import axios from "axios"
import { useState, useEffect } from "react"
import { FaStar, FaEnvelope, FaPhone, FaMapMarkerAlt, FaWifi,  FaParking, FaUtensils, FaPencilAlt, FaBed, FaDoorOpen, FaCheck, FaTimes } from "react-icons/fa"
import Image from "next/image"
import { EditProfileForm } from "@/components/EditProfileForm"
import { toast } from "sonner"
import { CloudinaryUpload } from "@/components/CloudinaryUpload"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
export interface Amenities {
    wifi: boolean;
    laundry: boolean;
    mess: {
        available: boolean;
        price_per_month: number;
    };
    security: boolean;
    powerBackup: boolean;
    kitchen: boolean;
    parking: boolean;
    electricity: {
        included_in_rent: boolean;
        price_per_unit: number;
    };
    transport: {
        speedo_stop: string;
        distance_in_meters: number;
    };
}

export interface ProfileData {
    hostel_id: string;
    hostel_name: string;
    addresses: {
        street: string;
        town: string;
        city: string;
    }[];
    hostel_email: string;
    hostel_phone: string;
    hostel_monthly_rent_range: {
        min: number;
        max: number;
    };
    hostel_rules: string[];
    amenities: Amenities;
    number_of_reviews: number;
    number_of_applications: number;
    hostel_images: string[];
    totalrooms: number;
    vacanciesavailable: number;
    total_vacancies: number;
}

const Profile = () => {
    const [profileData, setProfileData] = useState<ProfileData[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Starting to fetch profile data...');
                // Fetch profile data first
                const profileResponse = await axios.get('/api/fetchProfile');
                console.log('Profile Response:', profileResponse.data);
                
                if (!profileResponse.data.success) {
                    throw new Error(profileResponse.data.message || 'Failed to fetch profile data');
                }

                // Then fetch images
                const imagesResponse = await axios.get('/api/hostel/images');
                console.log('Images Response:', imagesResponse.data);
                
                if (!imagesResponse.data.success) {
                    throw new Error(imagesResponse.data.message || 'Failed to fetch images');
                }

                const profileData = profileResponse.data;
                const imagesData = imagesResponse.data;

                // The images array from the API should already contain full signed URLs
                const updatedProfileData = {
                    ...profileData.ProfileData[0],
                    hostel_images: imagesData.images || []
                };
                
                console.log('Setting profile data with image URLs:', updatedProfileData);
                console.log('Image URLs:', updatedProfileData.hostel_images);
                setProfileData([updatedProfileData]);
            } catch (error) {
                console.error('Error in fetchData:', error);
                toast.error(error instanceof Error ? error.message : "Error fetching profile data");
                // Set empty profile data to prevent infinite loading
                setProfileData([]);
            }
        };
        fetchData();
    }, []);

    // Add a debug effect to log when images change
    useEffect(() => {
        if (profileData.length > 0) {
            console.log('Current hostel images:', profileData[0].hostel_images);
            console.log('Active image index:', activeImageIndex);
            console.log('Current image URL:', profileData[0].hostel_images[activeImageIndex]);
        }
    }, [profileData, activeImageIndex]);

    const handleProfileUpdate = async () => {
        try {
            const [profileResponse, imagesResponse] = await Promise.all([
                axios.get('/api/fetchProfile'),
                axios.get('/api/hostel/images')
            ]);

            const profileData = await profileResponse.data;
            const imagesData = await imagesResponse.data;

            if (profileData.success && imagesData.success) {
                const updatedProfileData = {
                    ...profileData.ProfileData[0],
                    hostel_images: imagesData.images
                };
                setProfileData([updatedProfileData]);
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
            toast.error("Error refreshing profile data");
        }
    };

    const handleImageDelete = async (imagePath: string) => {
        try {
            const response = await axios.delete('/api/hostel/images', {
                data: { imagePath }
            });

            if (response.data.success) {
                toast.success("Image deleted successfully!", {
                    description: "The image has been removed from your hostel.",
                    duration: 5000,
                });
                // Refresh the profile data to update images
                handleProfileUpdate();
            } else {
                toast.error("Failed to delete image", {
                    description: response.data.message || "Please try again.",
                    duration: 5000,
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
            toast.error("Error deleting image", {
                description: errorMessage,
                duration: 5000,
            });
        }
    };

    if (profileData.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const hostel = profileData[0];

    return (
        <div className="min-h-screen  py-4 px-2 sm:py-8 sm:px-6 lg:px-8">
            <div className="w-full mx-auto">
                {/* Header Section with Edit Button */}
                <div className="bg-white rounded-lg border  overflow-hidden mb-4 sm:mb-8">
                    <div className="relative h-48 sm:h-64 md:h-96">
                        {hostel.hostel_images && hostel.hostel_images.length > 0 ? (
                            <Image
                                src={hostel.hostel_images[activeImageIndex]}
                                alt={hostel.hostel_name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    console.error('Image failed to load:', e);
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://placehold.co/600x400?text=No+Image';
                                }}
                                unoptimized={true}
                                priority={true}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-500">No images available</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 flex space-x-2">
                            {hostel.hostel_images.map((_, index) => (
                                <Button
                                    key={index}
                                    onClick={() => setActiveImageIndex(index)}
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Go to image ${index + 1}`}
                                    className={`w-3 h-3 rounded-full p-0 ${
                                        activeImageIndex === index ? 'bg-purple-500' : 'bg-purple-200'
                                    }`}
                                />
                            ))}
                        </div>
                        {/* Add image upload button */}
                        <div className="absolute top-4 right-4">
                            <CloudinaryUpload
                                onUploadSuccess={async (imageUrl) => {
                                    try {
                                        const response = await axios.post('/api/hostel/images', {
                                            imageUrl
                                        });
                                        if (response.data.success) {
                                            toast.success('Image uploaded successfully!');
                                            await handleProfileUpdate();
                                        }
                                    } catch (error) {
                                        console.error('Error saving image:', error);
                                        toast.error('Failed to save image');
                                    }
                                }}
                            />
                        </div>
                        {/* Add delete button for current image */}
                        {hostel.hostel_images && hostel.hostel_images.length > 0 && (
                            <Button
                                onClick={() => handleImageDelete(hostel.hostel_images[activeImageIndex])}
                                variant="destructive"
                                className="absolute top-4 right-32"
                            >
                                Delete Image
                            </Button>
                        )}
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">{hostel.hostel_name}</h1>
                                    <div className="flex items-center mt-1 sm:mt-2">
                                        <FaStar className="text-primary mr-1" />
                                        <span className="text-sm sm:text-base text-gray-600">{hostel.number_of_reviews} reviews</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setIsEditFormOpen(true)}
                                    variant="outline"
                                    size="lg"
                                    className="ml-4 text-gray-500 transition-colors"
                                    title="Edit Profile"
                                >
                                    <FaPencilAlt className="h-4 w-4" />Edit Profile
                                </Button>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <Badge variant="secondary">
                                    {typeof hostel.hostel_monthly_rent_range === 'object' ? 
                                        `${hostel.hostel_monthly_rent_range.min || 0} - ${hostel.hostel_monthly_rent_range.max || 0}` : 
                                        '0 - 0'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rooms and Vacancies Section */}
                <div className="bg-white rounded-lg border  p-4 sm:p-6 mb-4 sm:mb-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-primary">Room & Capacity Statistics</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                        <div className="flex items-center space-x-2 sm:space-x-4 bg-white p-3 sm:p-4 rounded-lg border ">
                            <FaBed className="text-2xl sm:text-3xl text-primary" />
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.totalrooms}</div>
                                <div className="text-xs sm:text-sm text-gray-600">Total Rooms</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 bg-white p-3 sm:p-4 rounded-lg border">
                            <FaBed className="text-2xl sm:text-3xl text-primary" />
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.totalrooms - hostel.vacanciesavailable}</div>
                                <div className="text-xs sm:text-sm text-gray-600">Occupied Rooms</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 bg-white p-3 sm:p-4 rounded-lg border">
                            <FaDoorOpen className="text-2xl sm:text-3xl text-primary" />
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.total_vacancies}</div>
                                <div className="text-xs sm:text-sm text-gray-600">Total Capacity</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 bg-white p-3 sm:p-4 rounded-lg border">
                            <FaDoorOpen className="text-2xl sm:text-3xl text-primary" />
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.vacanciesavailable}</div>
                                <div className="text-xs sm:text-sm text-gray-600">Available Capacity</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                        {/* Contact Information */}
                        <div className="bg-white rounded-lg border border-purple-200 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold  mb-3 sm:mb-4">Contact Information</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center">
                                    <FaEnvelope className=" mr-2 sm:mr-3" />
                                    <span className="text-sm sm:text-base text-gray-700">{hostel.hostel_email}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaPhone className=" mr-2 sm:mr-3" />
                                    <span className="text-sm sm:text-base text-gray-700">{hostel.hostel_phone}</span>
                                </div>
                                {hostel.addresses.map((address, index) => (
                                    <div key={index} className="flex items-start">
                                        <FaMapMarkerAlt className=" mr-2 sm:mr-3 mt-1" />
                                        <span className="text-sm sm:text-base text-gray-700">
                                            {address.street}, {address.town}, {address.city}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="bg-white rounded-lg border p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-emerald-900 mb-3 sm:mb-4">Amenities</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center border  rounded-md p-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.wifi ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaWifi className={hostel.amenities.wifi ? 'text-green-800' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">WiFi</span>
                                    {hostel.amenities.wifi ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border rounded-md p-2 ">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.laundry ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaUtensils className={hostel.amenities.laundry ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">Laundry</span>
                                    {hostel.amenities.laundry ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2 ">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.mess.available ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaUtensils className={hostel.amenities.mess.available ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">
                                        Mess ({hostel.amenities.mess.price_per_month}/month)
                                    </span>
                                    {hostel.amenities.mess.available ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.security ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaDoorOpen className={hostel.amenities.security ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">Security</span>
                                    {hostel.amenities.security ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2 ">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.powerBackup ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaWifi className={hostel.amenities.powerBackup ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">Power Backup</span>
                                    {hostel.amenities.powerBackup ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.kitchen ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaUtensils className={hostel.amenities.kitchen ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">Kitchen</span>
                                    {hostel.amenities.kitchen ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2 ">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.parking ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaParking className={hostel.amenities.parking ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">Parking</span>
                                    {hostel.amenities.parking ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                        hostel.amenities.electricity.included_in_rent ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                        <FaWifi className={hostel.amenities.electricity.included_in_rent ? 'text-primary' : 'text-red-500'} />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">
                                        Electricity ({hostel.amenities.electricity.price_per_unit}/unit)
                                    </span>
                                    {hostel.amenities.electricity.included_in_rent ? (
                                        <FaCheck className="ml-2 text-primary" />
                                    ) : (
                                        <FaTimes className="ml-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center border  rounded-md p-2 ">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-emerald-50">
                                        <FaMapMarkerAlt className="text-primary" />
                                    </div>
                                    <span className="text-sm sm:text-base text-gray-700">
                                        Nearest Speedo Stop: {hostel.amenities.transport.speedo_stop} ({hostel.amenities.transport.distance_in_meters}m)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4 sm:space-y-8">
                        {/* Rules */}
                        <div className="bg-white rounded-lg border border-purple-200 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-purple-900 mb-3 sm:mb-4">Hostel Rules</h2>
                            <ul className="space-y-2">
                                {hostel.hostel_rules.map((rule, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className=" mr-2">•</span>
                                        <span className="text-sm sm:text-base text-gray-700">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-lg border p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-emerald-900 mb-3 sm:mb-4">Statistics</h2>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-white rounded-lg p-3 sm:p-4 text-center border">
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.number_of_reviews}</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Reviews</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 sm:p-4 text-center border">
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-900">{hostel.number_of_applications}</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Applications</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditFormOpen && (
                <EditProfileForm
                    hostel={hostel}
                    open={isEditFormOpen}
                    onOpenChange={setIsEditFormOpen}
                    onProfileUpdated={handleProfileUpdate}
                />
            )}
        </div>
    );
};

export default Profile;
