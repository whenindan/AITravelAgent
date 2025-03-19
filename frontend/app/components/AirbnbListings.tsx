'use client';

import { useState } from 'react';
import Image from 'next/image';
import { StarIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface Listing {
  title: string;
  price_text: string;
  url: string;
  rating?: string;
  image_url?: string;
  fallback_image?: string;
  description: string;
  location: string;
  amenities?: string[];
}

interface AirbnbListingsProps {
  listings: Listing[];
  tripDays: number;
}

const AirbnbListings = ({ listings }: AirbnbListingsProps) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!listings || listings.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-[#151515] rounded-lg shadow-lg border border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-white">Recommended Airbnb Listings</h2>
        <p className="text-gray-400">No listings available at this time.</p>
      </div>
    );
  }

  const openModal = (listing: Listing) => {
    setSelectedListing(listing);
    setDialogOpen(true);
  };

  const closeModal = () => {
    setDialogOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-[#151515] rounded-lg shadow-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white">Recommended Airbnb Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listings.map((listing, index) => (
          <Card key={index} className="transition-transform hover:scale-[1.02]">
            {listing.image_url && (
              <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                <Image
                  src={listing.image_url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader className="pt-4 pb-0">
              <CardTitle className="text-white truncate">
                {listing.title}
              </CardTitle>
              <CardDescription className="font-medium text-gray-300">
                ${listing.price_text.split(' ')[0]}/night
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center mb-2">
                <StarIcon className="h-5 w-5 text-yellow-400" />
                <span className="ml-1 text-gray-400">
                  {listing.rating} ({listing.price_text.split(' ')[1]} reviews)
                </span>
              </div>
              <p className="text-gray-500 text-sm truncate">
                {listing.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => openModal(listing)}
                className="w-full"
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedListing && (
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedListing.title}</DialogTitle>
            </DialogHeader>

            {selectedListing.image_url && (
              <div className="relative h-64 w-full mb-4">
                <Image
                  src={selectedListing.image_url}
                  alt={selectedListing.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}

            <div className="mb-4">
              <p className="text-gray-300 font-bold text-lg">
                ${selectedListing.price_text.split(' ')[0]} per night
              </p>
              <div className="flex items-center mt-1">
                <StarIcon className="h-5 w-5 text-yellow-400" />
                <span className="ml-1 text-gray-400">
                  {selectedListing.rating} ({selectedListing.price_text.split(' ')[1]} reviews)
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">Description</h4>
              <p className="text-gray-400">{selectedListing.description}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">Location</h4>
              <p className="text-gray-400">{selectedListing.location}</p>
            </div>

            {selectedListing.amenities && selectedListing.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Amenities</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedListing.amenities.map((amenity, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-400"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={closeModal}
                className="mr-2"
              >
                Close
              </Button>
              <Button
                asChild
              >
                <a
                  href={selectedListing.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Airbnb
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AirbnbListings; 