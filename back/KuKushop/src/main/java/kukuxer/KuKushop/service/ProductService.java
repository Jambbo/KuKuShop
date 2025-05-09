package kukuxer.KuKushop.service;

import kukuxer.KuKushop.dto.Mappers.ProductMapper;
import kukuxer.KuKushop.dto.ProductDto;
import kukuxer.KuKushop.dto.BasketProductDto;
import kukuxer.KuKushop.entity.*;
import kukuxer.KuKushop.repository.CategoryRepository;
import kukuxer.KuKushop.repository.ProductRepository;
import kukuxer.KuKushop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final S3Service s3Service;
    private final ProductMapper productMapper;
    private final CategoryRepository categoryRepository;
    private final ProfileService profileService;
    private final ShopService shopService;
    private final FavoriteService favoriteService;
    private final BasketService basketService;
    private final ShopRepository shopRepository;


    public List<Product> getProductsByShopId(Long id) {
        return productRepository.getAllByShopId(id);
    }

    public ProductDto createProduct(ProductDto productDto, MultipartFile image, MultipartFile[] additionalImages, Long shopId) throws IOException {
        List<String> fileKeys = new ArrayList<>();
        if (image != null && !image.isEmpty()) {
            String fileKey = s3Service.uploadFile(image);
            fileKeys.add(fileKey);
            productDto.setImageUrl(fileKey);
        }
        if(additionalImages !=null){
            for (MultipartFile additionalImage : additionalImages) {
                fileKeys.add(s3Service.uploadFile(additionalImage));
            }
            productDto.setAdditionalPictures(fileKeys);
        }
        Product product = ProductMapper.INSTANCE.toEntity(productDto);
        Set<Category> categoryEntities = productDto.getCategories().stream()
                .map(name -> categoryRepository.findByName(name.toLowerCase().trim())
                        .orElseGet(() -> Category.builder()
                                .name(name.toLowerCase().trim())
                                .build()))
                .collect(Collectors.toSet());

        product.setCategories(categoryEntities);
        product.setShopId(shopId);
        System.out.println(product);
        Product savedProduct = productRepository.save(product);
        return productMapper.toDto(savedProduct);
    }

    public ProductDto getProductDtoById(UUID uuid, Jwt jwt) {
        Long userId = profileService.extractUserId(jwt);
        Product product = productRepository.findById(uuid)
                .orElseThrow(() -> new RuntimeException("no product with this id" + uuid));


        ProductDto productDto = productMapper.toDto(product);

        if(userId == null){
            return productDto;
        }

        productDto.setInBasket(basketService.isInBasket(product.getId(),userId));
        productDto.setFavorite(favoriteService.isFavorite(product.getId(),userId));
        Shop shop = shopService.getById(product.getShopId());
        if(jwt.getClaim("sub").equals(shop.getUserAuthId())){
            productDto.setOwner(true);
        }
        return productDto;
    }

    public List<ProductDto> getShopProductsDtoByName(String shopName, Jwt jwt) {
        Long userId = profileService.extractUserId(jwt);
        Shop shop = shopService.getByName(shopName);
        List<Product> products = getProductsByShopId(shop.getId());

        final Set<UUID> favoriteProductIds;
        final Set<UUID> basketProductIds;

        if (userId != null) {
            favoriteProductIds = new HashSet<>(favoriteService.getFavoriteProductIdsByUserId(userId));
            basketProductIds = basketService.getAllBasketProducts(jwt)
                    .stream()
                    .map(BasketProductDto::getId)
                    .collect(Collectors.toSet());
        } else {
            favoriteProductIds = Collections.emptySet();
            basketProductIds = Collections.emptySet();
        }

        return products.stream()
                .map(product -> {
                    ProductDto dto = productMapper.toDto(product);
                    dto.setFavorite(favoriteProductIds.contains(product.getId()));
                    dto.setInBasket(basketProductIds.contains(product.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

}
