export interface FSQRestaurantDTO {
  fsq_place_id: string;
  name: string;
  address: string;
  cuisine: string;
}

export interface FSQCategoryDTO {
  fsq_category_id: string;
  name: string;
  short_name: string;
  plural_name: string;
  icon: {
    prefix: string;
    suffix: string;
  };
}

export interface FSQPlaceAPIResponseDTO {
  fsq_place_id: string;
  name: string;
  location: {
    address: string;
    locality: string;
    region: string;
    postcode: string;
    country: string;
    admin_region: string;
    post_town: string;
    po_box: string;
    formatted_address: string;
  };
  categories: FSQCategoryDTO[];
}
